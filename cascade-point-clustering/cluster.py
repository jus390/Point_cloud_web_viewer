from sklearn import cluster;
import numpy as np;
import math
import time
from pyArango.connection import *
from laspy.file import File

conn = Connection(username="root", password="root")
db = conn["PointCloud"]
pointCol = db["Points"]
clusterCol = db["Clusters"]
edgesCol = db["Edges"]


LAS_FILE = "./points/stadium-utm.las"
DEPTH = 5
DIVISION = 10


def cascade_cluster(points, division, depth, k, lab="0"):
    if depth == 0 or len(points) <= division:
        return points
    # print "clustering depth:", depth, "branch: ", k
    print lab
    alg = cluster.KMeans(n_clusters=division)
    alg.fit(points)

    clusters = {}

    for i, v in enumerate(alg.labels_):
        if v in clusters:
            clusters[v] = np.vstack((clusters[v], points[i, :]))
        else:
            clusters[v] = np.array([points[i, :]])

    for k in clusters.keys():
        clusters[k] = {"points": cascade_cluster(clusters[k], division, depth - 1, k, lab + str(k)),
                       "center": alg.cluster_centers_[k],
                       "inertia": alg.inertia_}

    return clusters


def cascade_cluster_store(points, division, depth, label="0", root=True):
    print "Clustering:", label
    if depth == 0 or len(points) <= division:
        for i, p in enumerate(points):
            doc = pointCol.createDocument()
            doc["center"] = p.tolist()
            doc._key = label + str(i)
            doc.save()

            edge = edgesCol.createEdge()
            edge.links(clusterCol[label], doc)
            edge.save()
        return
        # print "clustering depth:", depth, "branch: ", k
    # print "Starting clustering"
    alg = cluster.KMeans(n_clusters=division, n_jobs=-1)
    alg.fit(points)
    # print "Clustering ended"

    clusters = {c: points[alg.labels_ == c, :] for c in range(division)}

    # print "Inserting clusters"
    for k in clusters.keys():
        doc = clusterCol.createDocument()
        doc["center"] = alg.cluster_centers_[k].tolist()
        # doc["inertia"] = clusters[k]["inertia"]
        doc._key = label + str(k)
        doc.save()

        edge = edgesCol.createEdge()
        edge.links(clusterCol[label], doc)
        edge.save()

        cascade_cluster_store(clusters[k], division, depth - 1, label + str(k), root=False)
        # clusters[k] = {"points": cascade_cluster(clusters[k], division, depth - 1, k, lab+str(k)),
        #                "center": alg.cluster_centers_[k],
        #                "inertia": alg.inertia_}


def cascade_cluster_linear(points, division, depth, label="0", root=True):
    pnts = []
    clust = []
    edges = []
    print "Clustering:", label
    if depth == 0 or len(points) <= division:
        for i, p in enumerate(points):
            pnts.append({"_key": label + str(i), "center": p.tolist()})
            edges.append({"_from": "Clusters/" + label, "_to": "Points/" + (label + str(i))})
        return (pnts, clust, edges)
        # print "clustering depth:", depth, "branch: ", k
    # print "Starting clustering"
    alg = cluster.KMeans(n_clusters=division, n_jobs=-1)
    alg.fit(points)
    # print "Clustering ended"

    clusters = {c: points[alg.labels_ == c, :] for c in range(division)}

    # print "Inserting clusters"
    for k in clusters.keys():
        clust.append({"_key": label + str(k), "center": alg.cluster_centers_[k].tolist()})

        edges.append({"_from": "Clusters/" + label, "_to": "Clusters/" + (label + str(k))})

        (pnts2, clust2, edges2) = cascade_cluster_linear(clusters[k], division, depth - 1, label + str(k), root=False)
        pnts.extend(pnts2)
        clust.extend(clust2)
        edges.extend(edges2)

    return (pnts, clust, edges)


def unformat(clusters, label, depth, division):
    points = None
    labels = None
    if type(clusters) is np.ndarray:
        return clusters, np.ones(len(clusters)) * int(label)

    for k in clusters.keys():
        pnt, lab = unformat(clusters[k]["points"], label + str(k), depth + 1, division)
        if points is None:
            points = np.array(pnt)
            labels = np.array(lab)
        else:
            points = np.vstack((points, pnt))
            labels = np.append(labels, lab)
    return points, labels


def linearizeLabels(labels):
    unique = np.unique(labels)

    for i, l in enumerate(unique):
        labels[labels == l] = i
    return labels


def storeStructure(clusters, label="", root=True):
    if type(clusters) is np.ndarray:
        for i, p in enumerate(clusters):
            doc = pointCol.createDocument()
            doc["center"] = p.tolist()
            doc._key = label + str(i)
            doc.save()
            if not root:
                edge = edgesCol.createEdge()
                edge.links(clusterCol[label], doc)
                edge.save()
        return

    for k in clusters.keys():
        doc = clusterCol.createDocument()
        doc["center"] = clusters[k]["center"].tolist()
        # doc["inertia"] = clusters[k]["inertia"]
        doc._key = label + str(k)
        doc.save()

        if not root:
            edge = edgesCol.createEdge()
            edge.links(clusterCol[label], doc)
            edge.save()

        storeStructure(clusters[k]["points"], label + str(k), False)

def storePoints(points):
    sizeOfInsert = 100000

    i = 0
    while (i * sizeOfInsert) < len(points):
        docs = points[i * sizeOfInsert:(i + 1) * sizeOfInsert]
        print "Inserting points", i * sizeOfInsert, "to", (i + 1) * sizeOfInsert
        pointCol.importBulk(docs)
        i += 1

def storeClusters(clusters):
    sizeOfInsert = 100000

    i = 0
    while (i * sizeOfInsert) < len(clusters):
        docs = clusters[i * sizeOfInsert:(i + 1) * sizeOfInsert]
        print "Inserting clusters", i * sizeOfInsert, "to", (i + 1) * sizeOfInsert
        clusterCol.importBulk(docs)
        i += 1

def storeEdges(edges):
    sizeOfInsert = 100000

    # for e in edges:
    #     print e
    #     doc = edgesCol.createEdge(e)
    #     print doc
    #     doc.save()
    i = 0
    while (i * sizeOfInsert) < len(edges):
        docs = edges[i * sizeOfInsert:(i + 1) * sizeOfInsert]
        print "Inserting edges", i * sizeOfInsert, "to", (i + 1) * sizeOfInsert
        edgesCol.importBulk(docs)

        i += 1

def readLas(file):
    inFile = File(file, mode="r")

    points = np.array([[float(p[0][0]) - float(inFile.points[0][0][0]), float(p[0][1]) - float(inFile.points[0][0][1]),
                        float(p[0][2]) - float(inFile.points[0][0][2])] for p in inFile.points])
    return points

def main():
    depth = DEPTH
    division = DIVISION
    points = readLas(LAS_FILE)
    print "Formated", len(points), "points"

    pointCol.truncate()
    print "point collection cleared"
    clusterCol.truncate()
    print "cluster collection cleared"
    edgesCol.truncate()
    print "edge collection cleared"

    start = time.time()
    clusters = {0: {"center": np.mean(points, 0)}}
    clusters[0]["points"] = points
    doc = clusterCol.createDocument()
    doc["center"] = clusters[0]["center"].tolist()

    doc._key = "0"
    doc.save()
    #cascade_cluster_store(points, division, depth)
    (pnts, clust, edges) = cascade_cluster_linear(points, division, depth)
    end = time.time()
    print(end - start)

    storePoints(pnts)
    storeClusters(clust)
    storeEdges(edges)




if __name__ == '__main__':
    main()
