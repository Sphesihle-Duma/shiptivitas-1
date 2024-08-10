
import React from 'react';
import Dragula from 'dragula';
import 'dragula/dist/dragula.css';
import Swimlane from './Swimlane';
import './Board.css';

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clients: {
        backlog: [], //clients.filter(client => !client.status || client.status === 'backlog'),
        inProgress: [], // clients.filter(client => client.status && client.status === 'in-progress'),
        complete: [] // clients.filter(client => client.status && client.status === 'complete'),
      }
    }
    this.swimlanes = {
      backlog: React.createRef(),
      inProgress: React.createRef(),
      complete: React.createRef(),
    }
  }
  async componentDidMount() {
    try {
      const clients = await this.getClients();
      this.setState({
        clients: {
          backlog: clients.filter(client => !client.status || client.status === 'backlog'),
          inProgress: clients.filter(client => client.status && client.status === 'in-progress'),
          complete: clients.filter(client => client.status && client.status === 'complete'),
        }
      }, () => {
        // Initialize Dragula in the callback to ensure state is updated
        this.initializeDragula();
      });
    } catch (error) {
      console.error("Error fetching clients data:", error);
    }
  }
  
  
  
  
  // Method to initialize Dragula
  initializeDragula() {

    this.drake = Dragula([
      this.swimlanes.backlog.current,
      this.swimlanes.inProgress.current,
      this.swimlanes.complete.current,
    ]);
  
    this.drake.on('drop', (el, target, source, sibling) => {
      this.updateClient(el, target, source, sibling)});
  }

  
  componentWillUnmount() {
    if (this.drake) {
      this.drake.destroy(); // Properly destroy Dragula instance
    }
  }
  



/*
 * Change the status of client when a Card is moved
 */
async updateClient(el, target, _, sibling){

   // Reverting DOM changes from Dragula

   this.drake.cancel(true);

   // Find out which swimlane the Card was moved to

  let targetSwimlane = "backlog";
  if(target === this.swimlanes.inProgress.current){
    targetSwimlane = "in-progress";
  }
  else if(target === this.swimlanes.complete.current){
    targetSwimlane = "complete";
  }

  // Create a new clients array
  const clientsList = [
    ...this.state.clients.backlog,
    ...this.state.clients.inProgress,
    ...this.state.clients.complete,
  ];
  
  // grabbing the card that was moved from the newly created array of all cards
  const clientThatMoved = clientsList.find(client => client.id === Number(el.dataset.id));
  console.log("client that moved", clientThatMoved)
  // Updating the status of the dragged and droped card
  const clientThatMovedClone ={
    ...clientThatMoved,
    status: targetSwimlane,
  }
  
  // Remove ClientThatMoved from the clientList
  const updatedClients = clientsList.filter(client => client.id !== clientThatMovedClone.id);

  // Place ClientThatMoved just before the sibling client, keeping the order
  const index = updatedClients.findIndex(client => sibling && client.id === Number(sibling.dataset.id));
  console.log("The index", index)
  // Inserting the client at the correct place.
  updatedClients.splice(index === -1 ? updatedClients.length : index , 0, clientThatMovedClone);


  console.log("sending Data", updatedClients)
  
  // Send updated order to the backend
  try {
    const response = await fetch('http://localhost:3001/api/v1/clients/update-positions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedClients),
    });

    if(!response.ok){
      throw new Error("Failed to update client positions");
    }
    const result = await response.json()
     console.log(result)

    if(result.status === "updated"){
      

       // Update React state to reflect changes
   this.setState({
    clients: {
      backlog: updatedClients.filter(client => !client.status || client.status === 'backlog'),
      inProgress: updatedClients.filter(client => client.status && client.status === 'in-progress'),
      complete: updatedClients.filter(client => client.status && client.status === 'complete'),
    },
  }, () => {
    console.log('Updated state:', this.state.clients);
  });

    }
  } catch (error) {
    console.error("Error updating client positions", error);
  }


 
 

}

 async getClients() {
    
    const response = await fetch('http://localhost:3001/api/v1/clients');
    const returnData = await response.json();
    console.log("returned data", returnData)
    return returnData;
  }

  renderSwimlane(name, clients, ref) {
    return (
      <Swimlane name={name} clients={clients} dragulaRef={ref}/>
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
