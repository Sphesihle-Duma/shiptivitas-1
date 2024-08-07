import React from 'react';
import Dragula from 'dragula';
import 'dragula/dist/dragula.css';
import Swimlane from './Swimlane';
import './Board.css';

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    //const clients = this.getClients();
    this.state = {
      clients: {
        backlog: [], //clients.filter(client => !client.status || client.status === 'backlog'),
        inProgress: [], //clients.filter(client => client.status && client.status === 'in-progress'),
        complete: [], //clients.filter(client => client.status && client.status === 'complete'),
      }
    }
    this.swimlanes = {
      backlog: React.createRef(),
      inProgress: React.createRef(),
      complete: React.createRef(),
    }
  }
  // Making cards on the swimlanes dragable 
 async componentDidMount(){
    await this.getClients()
    this.setupDragula()
  }

  async updateClientPositions(){
   let backlogPriority = 0;
   let inProgressPriority = 0;
   let completePriority = 0;
    const allClients = [...this.state.clients.backlog, 
      ...this.state.clients.complete, 
      ...this.state.clients.inProgress

    ].map(client => {
      const element = document.querySelector(`[data-id='${client.id}']`);
      if(element.closest('.backlog')){
        client.status = "backlog"
      }
      else if(element.closest('.inprogress')){
        client.status = "in-progress"
      }
      else if(element.closest('.complete')){
        client.status = "complete"
      }

      return client
    }).map(client =>{
      if(client.status ==="backlog"){
        backlogPriority += 1 
        client.priority = backlogPriority
      } 
      else if(client.status ==="in-progress"){
        inProgressPriority += 1
        client.priority = inProgressPriority
      }
      else if(client.status === "complete"){
        completePriority += 1
        client.priority = completePriority 
      }
      return client
    })

    //const sortedClients = allClients.sort((a, b) => a.priority - b.priority)

    console.log("sending data", allClients)
    try {
      const response = await fetch("http://localhost:3001/api/v1/clients/update-positions", {
        method: 'POST',
        headers: {
          'Content-Type': "application/json"
        },
        body: JSON.stringify(allClients)
      })
      const data = await response.json();
      console.log(data)
      
    } catch (error) {
      console.error("Error updating client positions", error);
      
    }    
  }
  

  
  // Fetching all clients from the database
  getClients = async() => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/clients');
      const returnData = await response.json();
      console.log("Returned array", returnData)
      this.setState({
        clients: {
          backlog: returnData.filter(client => !client.status || client.status === 'backlog').sort((a, b) => a.priority - b.priority),
          inProgress: returnData.filter(client => client.status && client.status === 'in-progress').sort((a, b) => a.priority - b.priority),
          complete: returnData.filter(client => client.status && client.status === 'complete').sort((a, b) => a.priority - b.priority),
        },
      });


      
    } catch (error) {
      console.log("Error fetching data for the clients:", error)
    }
  }

  setupDragula = () => {
    const containers = [
      this.swimlanes.backlog.current,
      this.swimlanes.inProgress.current,
      this.swimlanes.complete.current

    ];
    // changing the color of the cards when are drag and from and into the swimlanes

    const drake = Dragula(containers)

    drake.on('drag', (el) => {
      el.classList.add('dragging')
    })

    drake.on('dragend', (el) => {
      el.classList.remove('dragging')
      el.classList.remove('Card-grey', 'Card-blue', 'Card-green')
    
      if(el.closest('.backlog')){
        el.classList.add('Card-grey')
      }
      else if(el.closest('.inprogress')){
        el.classList.add('Card-blue')
      }
      else if(el.closest('.complete')){
        el.classList.add('Card-green')
      }
      this.updateClientPositions()
      
    })
    
    containers.forEach(container =>{
      container.addEventListener('touchmove', this.preventDefault, {passive: false})
    })
  }
  preventDefault = (e)=>{
    e.preventDefault();
  }
  // Updating swimlane to use the class name props
  renderSwimlane(name, clients, ref) {
    const swimlaneClass = name.replace(/\s+/g, '').toLowerCase()
    return (
      <Swimlane className={swimlaneClass} name={name} clients={clients} dragulaRef={ref}/>
    );
  }

  render() {
    return (
      <div className="Board">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-4">
              {this.renderSwimlane('Backlog', this.state.clients.backlog, this.swimlanes.backlog)}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane('In Progress', this.state.clients.inProgress, this.swimlanes.inProgress)}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane('Complete', this.state.clients.complete, this.swimlanes.complete)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

