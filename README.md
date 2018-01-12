# Point Cloud Web Viewer
A point cloud Web viewer created with the use of Three.js. The Viewer uses a novel hiarhical tree structure.The structure is constructed by recursively clustering points using k-means, obtaining a tree with cluster centers in the nodes and points in the leafs. The structure is fully balanced, which allows us to control the amount of points in a certain location of the dataset.
The structure is stored in a Arango DB graph. A simple Koa.js backend is made to interface with the stored structure.

See individual subfolder for readmes of individual modules.

## Requirenments:
1. Python with:
..* Scikit-learn
..* LasPy
..* ArangoPy
2. ArangoDB (tested on version 3.3.1)
3. Node.js/Yarn
..* use yarn or npm to fetch the required packages
