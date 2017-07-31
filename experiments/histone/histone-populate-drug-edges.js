/**
 * Created by: Servio Palacios
 * Source: histone-populate-drug-edges.js
 * Author: Servio Palacios
 * Description: Shamim's Demo Network
 *
 */

const Trueno   = require('../../lib/trueno');
const edges    = require('./datasets/histone-drug-edges-source.json');
let vertices   = require('./datasets/histone-vertices-source.json');
let htVertices = {};

/* Trueno's Connection */
let trueno = new Trueno({host: 'http://localhost', port: 8000, debug: false});

trueno.connect((s)=> {

  const batchSize = 500;

  /* Create a new Graph */
  let g = trueno.Graph();

  /* Set label: this is the graph name or index */
  g.setLabel("histone");

  let eQueue = edges;
  let total = eQueue.length, current = 0;
  console.log("Edges Total: " + total);

  let edgeSource = 0;
  let edgeDestination = 0;

  vertices.forEach((vertex)=> {

    if (htVertices.hasOwnProperty(vertex.name)) {
      console.log("Vertex repeated");
    }
    else{
      htVertices[vertex.name.toString().trim().toUpperCase()] = {};
      htVertices[vertex.name.toString().trim().toUpperCase()].id = vertex.id;
    }

  });//end vertices hash table

  /* Insertion function */
  function insertEdge(arr) {
    let badEdges = 0;
    let goodEdges = 0;
    let badSources = 0;
    let badDestination = 0;

    /* persist everything into a batch */
    g.openBatch();

    /* Persist all edges */
    arr.forEach((edge)=> {
      edgeSource = htVertices[edge.source.toString().trim().toUpperCase()].id;
      edgeDestination = htVertices[edge.destination.toString().trim().toUpperCase().substring(0,edge.destination.toString().length-3)].id;

      if(edgeSource == null){
        badSources++;
      }

      if(edgeDestination == null){
        badDestination++;
      }

      if (edgeSource == null || edgeDestination == null){
        badEdges++;
      }
      else {
        let e = g.addEdge(edgeSource, edgeDestination);
        e.setLabel(edge.direction);
        e.setProperty("oriweight_basis", edge.oriweight_basis);
        e.setProperty("weight_basis", edge.weight_basis);
        e.setProperty("loading_val", edge.weight_basis);
        e.setProperty("direction", edge.direction);
        e.setId(current);
        e.persist();
        current++;
        goodEdges++;
      }
    });

    console.log("Good edges: " + goodEdges);
    console.log("Bad edges: " + badEdges);
    console.log("Bad Source: " + badSources);
    console.log("Bad Destination: " + badDestination);

    /* insert batch */
    g.closeBatch().then((result) => {
      console.log("Edges batch created.", current / total);
      /* Continue inserting */
      if (eQueue.length) {
        insertEdge(eQueue.splice(0, batchSize));
      } else {
        process.exit();
      }
    }, (error) => {
      console.log("Error: Edges batch creation failed.", error, current / total);
      /* Continue inserting */
      if (eQueue.length) {
        insertEdge(eQueue.splice(0, batchSize));
      } else {
        process.exit();
      }
    });

  }

  /* Initiating edge insertion */
  insertEdge(eQueue.splice(0, batchSize));

}, (s)=> {
  console.log('disconnected', s.id);
});

