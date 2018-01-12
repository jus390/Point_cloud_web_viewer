# Point cloud backend
The backend api written in node.js. Before running use yarn to fetch all required packages. Also in the script *Database.js* check if the database and authentication details are correct.

The api supports the following functions:

REQUEST TYPE | ROUTE | PARAMS | DECRIPTION
------------ | ----- | ------ | ----------
POST | /points | {cluster, depth} | Fetches all the points that are "depth" bellow "cluster". Cluster being the key of the strating cluster.
POST | /points/batch | [requests] |  Similar function as the request above, only that it fatches multiple subsets of points. "requests" is an array of JSON with the same structure as in "POST /Points".
GET | /points/center |  |  Centers the points in the database to the root node.
POST | /points/scale | {scale} |  Scales the points in the database based on the scale paramaters.
GET | /points/generate |  |  API generates 10000 random points.
