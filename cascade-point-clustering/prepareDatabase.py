from pyArango.connection import *
from pyArango.collection import *
from pyArango.graph import Graph, EdgeDefinition

def setupDatabase(name):
    conn = Connection(username="root", password="root")

    conn.createDatabase(name=name)
    print "Database created"
    db = conn[name]
    url = "%s/import" % db.URL

    clusters = db.createCollection(className='Collection', name="Clusters")
    print "Clusters collection created"
    with open("./import/Clusters.json") as f:
        data = f.read()
        conn.session.post(url, params={"collection": "Clusters", "type": "auto"}, data=data)

    points = db.createCollection(className='Collection', name="Points")
    print "Points collection created"
    with open("./import/Points.json") as f:
        data = f.read()
        conn.session.post(url, params={"collection": "Points", "type": "auto"}, data=data)

    edges = db.createCollection(className='Edges', name="Edges")
    print "Edge collection created"
    with open("./import/Edges.json") as f:
        data = f.read()
        conn.session.post(url, params={"collection": "Edges", "type": "auto"}, data=data)

    class PointCloud(Graph):
        _edgeDefinitions = [EdgeDefinition("Edges", fromCollections=["Clusters"], toCollections=["Clusters", "Points"])]
        _orphanedCollections = []

    theGraph = db.createGraph(name="PointCloud")



setupDatabase("PointCloud")
