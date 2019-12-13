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
        <div>
          <div>
            time: {timeHelper.formatTime(this.state.totalTime)}
          </div>
          <button disabled={this.state.currentSplit !== null} onClick={() => {this.start()}}>Start</button>
          <button disabled={this.state.currentSplit === null} onClick={() => {this.stop()}}>Stop</button>
          <button disabled={this.state.currentSplit === null} onClick={() => {this.forwardSplit()}}>Split</button>
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
        </div>
    );
  }
}

export default App;
