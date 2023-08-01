const canvas = document.getElementById("logo");
const ctx = canvas.getContext("2d");
var f = 0; // frames
brain_dim=[250, 250];
brain_matrices = []; //because I don't collect all and save, but display them immediatelly, I am not using this one
n_iterations = 850;
brain_discharges = [];
epileptiform_bursts_onset_timing = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45]
epileptiform_burst_shapes=[[1,25],[25,1],[2, 10],[10, 2]];
epileptiform_prob_onset_neurons = [0.25, 0.25666667, 0.26333333, 0.27, 0.27666667, 0.28333333, 0.29, 0.29666667, 0.30333333, 0.31, 0.31666667, 0.32333333, 0.33, 0.33666667, 0.34333333, 0.35];
seizure_bursts_onset_timing=[50, 50, 50, 50, 50, 50]
seizure_burst_shapes=[[5,5],[4,8],[8,4],[3,4],[4,9]]
seizure_prob_onset_neurons=[0.5, 0.51, 0.52, 0.53, 0.54, 0.55, 0.56, 0.57, 0.58, 0.59, 0.6 , 0.61, 0.62, 0.63, 0.64, 0.65, 0.66, 0.67, 0.68, 0.69, 0.7, 0.71, 0.72, 0.73, 0.74, 0.75, 0.76, 0.77, 0.78, 0.79, 0.8]
seizure_burst_coordinates=[[200, 50],[100, 150],[120,40],[200, 150],[50, 50],[200, 200]]
seizure_burst_counter=0

class discharge {
  // this.type_discharge=type_discharge
  // this.onset_prob_neuron=onset_prob_neuron
  // this.focus_size=focus_size
  constructor (type_discharge, onset_prob_neuron, focus_size, brain_shape, center=[-1,-1]) {
    this.type_discharge=type_discharge;
    this.onset_prob_neuron=onset_prob_neuron;
    this.focus_size=focus_size;
    console.log("focus_size: "+focus_size);
    this.brain_shape=brain_shape;
    this.center=center;
  
    this.p_switch=1;
    this.mytruth;
    this.brain=[];
    this.mysum = 0;

    for (var i=0; i<this.brain_shape[0]; i++){
      this.brain[i]=[];
      for (var j=0; j<this.brain_shape[1]; j++) {
        this.brain[i][j] = 0;
      }
    }
    console.log(this.center);
    if (this.isDefaultCenter(this.center)){ // no input center was provided
      console.log("please choose a random center");
      this.choose_random_center();
    } else { // use the provided input center
      console.log("a center was provided");
      this.center=center; 
    }
    this.iteration=0;
    this.p_switches=[];
    this.p_switch_start=0;
  }

  start(){
    this.discharge_beginning();
    this.iteration++;
  }

  logme(){
    console.log("hello from logme");
  }

  run(){
    if (!this.isDischargeEnded()) {
      this.update_p_switch();
      this.activity_each_iteration();
      this.iteration++;
    }
  }
  
  isDefaultCenter(arr){
    for (var i=0; i<arr.length; i++) {
      if (arr[i] !== -1) return false;
    }
    return true;
  }

  isDischargeEnded(){
    console.log("inside isDischargeEnded 1");
    var mysum = 0;
    for (var i=0; i<this.brain.length; i++){
      for (var j=0; j<this.brain[0].length; j++) {
        mysum += this.brain[i][j];
      }
    }
    if (mysum==0) {
      return true;
    } else {
      return false;
    }
  }
  
  choose_random_center(){
    var focus_x = Math.floor( Math.random()*(this.brain.length-this.focus_size[0]) );
    console.log("focus_x: "+focus_x);
    var focus_y = Math.floor( Math.random()*(this.brain[0].length-this.focus_size[1]) );
    console.log("focus_y: "+focus_y);
    this.center=[focus_x, focus_y];
  }
  
  discharge_beginning(){
    // iterate all the matrix (lines and collumns)
    for (var i=this.center[0]; i<(this.center[0]+this.focus_size[0]); i++){
      for (var j=this.center[1]; j<(this.center[1]+this.focus_size[1]); j++) {
        // firing each focus neuron according to a probability
        if (Math.random() < this.onset_prob_neuron) {
          this.brain[i][j]=1;
        }
      }
    }
  }

  activity_each_iteration(){
    // create a copy of the brain matrix to create the next generation brain state
    var new_brain=this.brain;
    // Loop through each neuron in the brain matrix
    for (var i=0; i<this.brain.length; i++){
      for (var j=0; j<this.brain[0].length; j++) {
        // Get the number of neighboring neurons that are in the "on" state
        var neighbors = 0;
        if (i>0 && j>0) {
          if (this.brain[i-1][j-1]==1) {neighbors++}
        }
        if (i>0) {
          if (this.brain[i-1][j]==1) {neighbors++}
          if (j<this.brain[0].length-1) {if (this.brain[i-1][j+1]==1) {neighbors++}}
        }
        if (j>0) {
          if (this.brain[i][j-1]==1) {neighbors++}
          if (i<this.brain.length-1) {if (this.brain[i+1][j-1]==1) {neighbors++}}
        }
        if (j<this.brain[0].length-1) {if (this.brain[i][j+1]==1) {neighbors++}}
        if (i<this.brain.length-1) {if (this.brain[i+1][j]==1) {neighbors++}}
        if (i<this.brain.length-1 && j<this.brain[0].length-1) {if (this.brain[i+1][j+1]==1) {neighbors++}}
        
        // Check if the neuron should switch its state based on the number of "on" neighboring neurons and the probability of switching (p_switch)
        if (neighbors >= 2 && Math.random() < this.p_switch) {
          new_brain[i][j]=1;
        } else {new_brain[i][j]=0}
      }
      // replace the brain matrix by the new one
      this.brain=new_brain;
    }
  }
          
  update_p_switch(){
    if (this.type_discharge=="seizure"){
      this.update_p_switch_seizure()
    } else if (this.type_discharge=="interictal_epileptiform"){
      this.update_p_switch_epileptiform()
    }
    // saving new p_switch value
    this.p_switches.push(this.p_switch);
  }
      
  update_p_switch_seizure() {
    this.p_switch_start=0.51;
    // updating current p_switch value
    if(this.iteration>=1 && this.iteration<=4){
      this.p_switch = 0.07*this.iteration+this.p_switch_start;
    } else if (this.iteration>=5 && this.iteration<=6){
      this.p_switch=0.95;
    } else if (this.iteration>=7 && this.p_switch>0.45){
      this.p_switch=this.p_switch-0.03;
    } else if(this.iteration>=22 && this.iteration<=600 && this.p_switch<=0.45){
      this.p_switch=0.46 + ( Math.cos(Math.floor(Math.random() * (Math.PI-(-Math.PI)) ) + (-Math.PI)) *0.03);
    } else if(this.iteration>600){
      this.p_switch=0.43 + ( Math.cos(Math.floor(Math.random() * (Math.PI-(-Math.PI)) ) + (-Math.PI)) *0.02);
    }
       
  }  
           
  update_p_switch_epileptiform() {
    this.p_switch_start=0.51;
    // updating current p_switch value
    if(this.iteration>=1 && this.iteration<=3){
      this.p_switch=0.07*this.iteration+this.p_switch_start;
    } else if (this.iteration>=4 && this.p_switch>0.45){
      this.p_switch=this.p_switch-0.10;  
    } else if (this.iteration>5){
      this.p_switch=0.33 + ( Math.cos(Math.floor(Math.random() * (Math.PI-(-Math.PI)) ) + (-Math.PI)) *0.02);
    }
    
  }   
      
} // end of discharge definition

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  console.log("f: "+f);
  if (f<n_iterations){
    
    var new_brain=[];
    for (var i=0; i<brain_dim[0]; i++){
      new_brain[i]=[];
      for (var j=0; j<brain_dim[1]; j++) {
        new_brain[i][j] = 0;
      }
    }

    for (var i=0; i<brain_discharges.length; i++){
      brain_discharges[i].run();
      console.log("after run()");
      if (brain_discharges[i].isDischargeEnded()) {
        brain_discharges.splice(i,1);
        i--;
      }
    }

    if (epileptiform_bursts_onset_timing.includes(f)) {
      // type_discharge, onset_prob_neuron, focus_size, brain_shape, center=[-1,-1]
      brain_discharges.push(new discharge(
        'interictal_epileptiform',
        epileptiform_prob_onset_neurons[Math.floor( Math.random()*(epileptiform_prob_onset_neurons.length) )],
        epileptiform_burst_shapes[Math.floor( Math.random()*(epileptiform_burst_shapes.length) )],
        brain_dim)
      );
      brain_discharges[brain_discharges.length - 1].start();
    }
    
    if (seizure_bursts_onset_timing.includes(f)) {
      // type_discharge, onset_prob_neuron, focus_size, brain_shape, center=[-1,-1]
      for (var k=0;k<seizure_bursts_onset_timing.filter(x => x==f).length;k++){
        brain_discharges.push(new discharge(
          'seizure',
          seizure_prob_onset_neurons[Math.floor( Math.random()*(seizure_prob_onset_neurons.length) )],
          seizure_burst_shapes[Math.floor( Math.random()*(seizure_burst_shapes.length) )],
          brain_dim,
          seizure_burst_coordinates[seizure_burst_counter])
        );
        brain_discharges[brain_discharges.length - 1].start();
        seizure_burst_counter++;
      }
    }

    for (var k=0;k<brain_discharges.length;k++) {
      for (var i=0; i<brain_dim[0]; i++){
        for (var j=0; j<brain_dim[1]; j++) {
          new_brain[i][j] += brain_discharges[k].brain[i][j];
          if (new_brain[i][j]>1) {new_brain[i][j]=1}
        }
      }  
    }

    //finally draw it
    for (var i=0; i<brain_dim[0]; i++){
      for (var j=0; j<brain_dim[1]; j++) {
        // stroke(new_brain[i][j]*255);
        color = new_brain[i][j]*255;
        // point(i, j);
        ctx.fillStyle = "rgb("+color+", "+color+", "+color+")";
        ctx.fillRect(i, j, 1, 1)
      }
    }

  }
  if (f>(n_iterations+10) && f<(n_iterations+70)) {
    ctx.font = "30px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText("execution_E", canvas.width/2, canvas.height/2);
  }
  f++;
  if (f<(n_iterations+80)) {
    requestAnimationFrame(draw);
  }
}


document.addEventListener('DOMContentLoaded', () => draw());