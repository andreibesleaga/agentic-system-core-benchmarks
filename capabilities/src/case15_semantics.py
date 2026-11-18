"""Case 15: the published graph read by independent, standard RDF tools (rdflib, pyshacl).

Usage: python case15_semantics.py <engine-dir> <out.json> name=<www-dir> [name=<www-dir> ...]
Reads only; writes <out.json>. No network: the JSON-LD form is not parsed here because its
context is a remote document.
"""
import json
import sys
from collections import Counter

import rdflib
import rdflib.plugins.sparql
from rdflib import Dataset, Graph
from rdflib.compare import isomorphic
from pyshacl import validate

STANDARD = {
    "http://purl.org/dc/terms/": "Dublin Core",
    "http://www.w3.org/2004/02/skos/core#": "SKOS",
    "http://www.w3.org/ns/prov#": "PROV",
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#": "RDF",
    "http://www.w3.org/2000/01/rdf-schema#": "RDFS",
    "https://schema.org/": "schema.org",
    "http://schema.org/": "schema.org",
    "http://www.w3.org/2002/07/owl#": "OWL",
}
OWN = "https://w3id.org/agentic-system-core/ns#"


def plain(g):
    """The same graph with xsd:string literals written plain (one literal in RDF 1.1, two terms in rdflib)."""
    out = Graph()
    for s, p, o in g:
        if isinstance(o, rdflib.Literal) and o.datatype == rdflib.XSD.string:
            o = rdflib.Literal(str(o))
        out.add((s, p, o))
    return out


def union_of_quads(path):
    """All statements of an N-Quads file as one graph."""
    ds = Dataset()
    ds.parse(path, format="nquads")
    g = Graph()
    for s, p, o, _ in ds.quads((None, None, None, None)):
        g.add((s, p, o))
    return g


def vocabulary_share(g):
    """Statements by the vocabulary of their predicate."""
    counts = Counter()
    for _, p, _ in g:
        text = str(p)
        name = next((label for ns, label in STANDARD.items() if text.startswith(ns)), None)
        counts[name or ("own" if text.startswith(OWN) else "other")] += 1
    return dict(counts)


def run_questions(g, questions, prefixes):
    """Each published SPARQL question, once per item as ?x; counts queries that ran and that answered."""
    header = "\n".join(f"PREFIX {p}" for p in prefixes)
    subjects = sorted({s for s in g.subjects() if isinstance(s, rdflib.URIRef)})
    rows = []
    for q in questions:
        ran = answered = failed = 0
        if "<S...>" in q["sparql"]:  # a template: the caller puts a selection of items in it
            rows.append({"number": q["number"], "question": q["question"], "needs_input": "a selection of items"})
            continue
        try:
            prepared = rdflib.plugins.sparql.prepareQuery(header + "\n" + q["sparql"])
        except Exception as error:  # a query this engine cannot parse is reported, not hidden
            rows.append({"number": q["number"], "question": q["question"], "parse_error": str(error)[:200]})
            continue
        uses_x = "?x" in q["sparql"]
        for s in subjects if uses_x else [None]:
            try:
                result = list(g.query(prepared, initBindings={"x": s} if uses_x else {}))
                ran += 1
                answered += bool(result)
            except Exception:
                failed += 1
        rows.append({"number": q["number"], "question": q["question"], "subjects": len(subjects) if uses_x else 1,
                     "ran": ran, "answered": answered, "failed": failed})
    return rows


def main():
    engine, out = sys.argv[1], sys.argv[2]
    spec = json.load(open(f"{engine}/docs/ontology-questions.json"))
    shapes = Graph().parse(f"{engine}/schema/item-shapes.ttl", format="turtle")
    ontology = Graph().parse(f"{engine}/ontology/agsc.ttl", format="turtle")
    alignments = Graph().parse(f"{engine}/ontology/alignments.ttl", format="turtle")
    OWL = rdflib.OWL
    result = {
        "tools": {"rdflib": rdflib.__version__, "pyshacl": __import__("pyshacl").__version__},
        "ontology": {
            "statements": len(ontology),
            "classes": len(set(ontology.subjects(rdflib.RDF.type, OWL.Class))),
            "object_properties": len(set(ontology.subjects(rdflib.RDF.type, OWL.ObjectProperty))),
            "datatype_properties": len(set(ontology.subjects(rdflib.RDF.type, OWL.DatatypeProperty))),
            "alignment_statements": len(alignments),
        },
        "shapes_statements": len(shapes),
        "nodes": {},
    }
    for pair in sys.argv[3:]:
        name, www = pair.split("=", 1)
        turtle = Graph().parse(f"{www}/graph.ttl", format="turtle")
        quads = union_of_quads(f"{www}/graph.nq")
        conforms, report, _ = validate(turtle, shacl_graph=shapes, inference="none")
        SH = rdflib.Namespace("http://www.w3.org/ns/shacl#")
        severities = Counter(str(o).split("#")[-1] for o in report.objects(None, SH.resultSeverity))
        result["nodes"][name] = {
            "turtle_statements": len(turtle),
            "nquads_statements": len(quads),
            "turtle_equals_nquads": isomorphic(plain(turtle), plain(quads)),
            "shacl_conforms": bool(conforms),
            "shacl_results_by_severity": dict(severities),
            "statements_by_vocabulary": vocabulary_share(turtle),
            "questions": run_questions(quads, spec["questions"], spec["prefixes"]),
        }
    json.dump(result, open(out, "w"), indent=2, sort_keys=True)
    print(json.dumps(result, indent=1)[:200])


if __name__ == "__main__":
    main()
