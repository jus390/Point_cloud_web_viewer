# Cascade point clustering
In this module you can import an example dataset into ArangoDB or construct your own structure from your own *.las* file.

## Requirenments:
* Python(2.7) with:
  * Scikit-learn
  * LasPy
  * ArangoPy
* ArangoDB
## Import
If you want to just import the structure, just run the *prepareDatabase.py* script. Make sure that the authentication details are correct before running it and all the dependecies are met.

## Constructing the structure on your own files
To construct the structure on your own files you run the script *cluster.py*. Before running this scipt you should first run *prepareDatabase.py* if you have not before. This script also truncates the individual collections the structure is stored in.
Before running you should also set the following items:
1. Check the authentication details in the script
1. Set the *LAS_FILE* paramter to the root of your .las file
1. Set the DEPTH (the maximum depth of the structure) paramter.
1. Set the DIVISION (the the data is devided by in each node, currently only values between 2 and 10 are supported) parameter.
