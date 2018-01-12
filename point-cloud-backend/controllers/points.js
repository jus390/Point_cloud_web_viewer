const Database = require("../Database.js");

async function generatePoints(ctx, next) {
  let points = [];

  for (let i = 0; i < 10000; i++) {
    points.push({
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100,
      z: (Math.random() - 0.5) * 100
    });
  }

  ctx.body = {
    points: points
  };
}

async function fetchPoints(ctx, next) {
  let param = {
    depth: 2,
    cluster: "Clusters/0"
  };

  if (ctx.request.body.cluster) {
    param.cluster = "Clusters/" + ctx.request.body.cluster;
  }

  if (ctx.request.body.depth) {
    param.depth = ctx.request.body.depth;
  }

  let query = await Database.db.query(
    'FOR v,e,p IN @depth..@depth OUTBOUND @cluster GRAPH "PointCloud" RETURN { point: v.center, key: v._key }', {
      depth: param.depth,
      cluster: param.cluster
    }, {
      count: true,
      batchSize: 10000
    }
  );
  //console.log(query)
  ctx.body = {
    points: query._result
  };
}

async function fetchPointsBatch(ctx, next) {
  let requests = ctx.request.body.requests;
  let results = [];

  for (let r of requests) {
    let query = await Database.db.query(
      'FOR v,e,p IN @depth..@depth OUTBOUND @cluster GRAPH "PointCloud" RETURN { point: v.center, key: v._key }', {
        depth: r.depth,
        cluster: "Clusters/" + r.cluster
      }, {
        count: true,
        batchSize: 10000
      }
    );
    results = results.concat(query._result);
  }
  ctx.body = {
    points: results
  };
}

async function centerPoints(ctx, next) {
  let query = await Database.db.query(
    'LET root = DOCUMENT("Clusters/0") FOR doc IN Points UPDATE doc WITH {center: [doc.center[0]-root.center[0], doc.center[1]-root.center[1], doc.center[2]-root.center[2]]} IN Points'
  );
  query = await Database.db.query(
    'LET root = DOCUMENT("Clusters/0") FOR doc IN Clusters UPDATE doc WITH {center: [doc.center[0]-root.center[0], doc.center[1]-root.center[1], doc.center[2]-root.center[2]]} IN Clusters'
  );
  ctx.body = "Points centered";
}

async function scalePoints(ctx, next) {
  let scale = ctx.request.body.scale;
  let query = await Database.db.query(
    'FOR doc IN Clusters UPDATE doc WITH {center: [doc.center[0]*@scale, doc.center[1]*@scale, doc.center[2]*@scale]} IN Clusters', {
      scale: scale
    }
  );
  query = await Database.db.query(
    'FOR doc IN Points UPDATE doc WITH {center: [doc.center[0]*@scale, doc.center[1]*@scale, doc.center[2]*@scale]} IN Points', {
      scale: scale
    }
  );
  ctx.body = "Points scaled";
}

module.exports = {
  generatePoints,
  fetchPoints,
  fetchPointsBatch,
  centerPoints,
  scalePoints
};