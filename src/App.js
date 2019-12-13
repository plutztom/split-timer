import React, {Component} from 'react';
import './App.css';
import timeHelper from './helpers/timeHelper.js';
import RunService from './helpers/RunService';

class App extends Component {
  state = {
    totalTime: 0,
    currentSplit: null,
    splits: []
  };
  componentDidMount() {
    RunService.GetRunDefinition(1).then(res => {
      this.setState({
        splits: res
      })
    })
  }

  componentDidUpdate() {
    requestAnimationFrame(this.tick.bind(this));
  }

  tick() {
      if (this.state.currentSplit !== null){
        const now = timeHelper.convertToCentiSeconds(Date.now());
        const totalTime = now - this.state.start;
        this.setState({
          totalTime
        });
      }
  };
  start() {
    this.setState(
        {
          currentSplit:0,
          start: timeHelper.convertToCentiSeconds(Date.now())
        },
        this.tick
    )
  }
  stop() {
    let splits = this.state.splits;
    splits.forEach((elm) => {
      elm.current = '--';
    });
    this.setState(
        {
          currentSplit:null,
          start: null,
          totalTime: 0,
          splits: splits
        }
    )
  }

  forwardSplit() {
    let splits = this.state.splits;
    splits[this.state.currentSplit].current = this.state.totalTime;
    if (splits[this.state.currentSplit].best === '--' || this.state.totalTime < splits[this.state.currentSplit].best) {
      splits[this.state.currentSplit].best = this.state.totalTime;
    }
    this.setState(
        {
          currentSplit: this.state.currentSplit + 1,
          splits: splits
        },() => {
          if (this.state.currentSplit + 1 >= splits.length){
            this.stop();
          }
        }
    );
  }
  formatDiff(current,best) {
    if (best - current < 0){
      return `+${timeHelper.formatTime(Math.abs(best - current))}`
    }else{
      return `-${timeHelper.formatTime(Math.abs(best - current))}`
    }
  }

  render() {
    return (
      <div class="container-fluid">
          <div class="row">
          <nav class="col-md-2 d-none d-md-block bg-light sidebar">
      <div class="sidebar-sticky">


             <ul class="list-group">
  <li class="list-group-item d-flex justify-content-between align-items-center text-muted">
                Split: <span class="font-weight-bold text-primary">elm name</span></li>
                  <li class="list-group-item d-flex justify-content-between align-items-center">Current: <span>00:00:00</span></li>

                </ul>


                <div class="fixed-top">
          <h1 class="display text-muted"> {timeHelper.formatTime(this.state.totalTime)}</h1>
          </div>
          <button class="btn btn-success pt-2 pb-2 btn-floating" disabled={this.state.currentSplit !== null} onClick={() => {this.start()}}><i class="material-icons">
          play_arrow
</i></button>
<button class="btn btn-danger pt-2 pb-2 btn-floating" disabled={this.state.currentSplit === null} onClick={() => {this.stop()}}><i class="material-icons">
        pause
</i></button>
<button class="btn btn-warning pt-2 pb-2 btn-floating text-white"  disabled={this.state.currentSplit === null} onClick={() => {this.forwardSplit()}}><i class="material-icons">
        replay
</i></button>
          {this.state.splits.map((elm,i) => {
            return (
                <div>
                  <div>Split: {elm.name}</div>
                  <div>Current: {elm.current === '--' ? '--' : timeHelper.formatTime(elm.current)}</div>
                  <div>Best: {elm.best === '--' ? '--' : timeHelper.formatTime(elm.best)}</div>
                  <div>Split Diff: {elm.current === '--' || elm.best === '--' ? '--' : this.formatDiff(elm.current,elm.best)}</div>
                </div>
            )
          })
          }
        </div></nav></div></div>
    );
  }
}

export default App;
