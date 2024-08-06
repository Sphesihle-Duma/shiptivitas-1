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
        backlog: [],
        inProgress: [],
        complete: [],
      }
    };
    this.swimlanes = {
      backlog: React.createRef(),
      inProgress: React.createRef(),
      complete: React.createRef(),
    };
  }

  async componentDidMount() {
    await this.getClients();
    this.setupDragula();
  }

  updateClientPositions = async () => {
    try {
      const allClients = [
        ...this.state.clients.backlog,
        ...this.state.clients.inProgress,
        ...this.state.clients.complete
      ].map(client => {
        const element = document.querySelector(`[data-id='${client.id}']`);
        if (!element) {
          console.error(`Element with data-id='${client.id}' not found`);
          return client;
        }

        const parent = element.closest('.Swimlane-column');
        if (parent) {
          const swimlaneClass = parent.className.split(' ')[1];
          client.status = swimlaneClass;
          client.priority = Array.from(parent.children).indexOf(element);
          console.log(`Client ${client.id} moved to ${client.status} with priority ${client.priority}`);
        } else {
          console.error(`Parent element of ${element} not found`);
        }

        return client;
      });

      this.setState({
        clients: {
          backlog: allClients.filter(client => client.status === 'backlog').sort((a, b) => a.priority - b.priority),
          inProgress: allClients.filter(client => client.status === 'in-progress').sort((a, b) => a.priority - b.priority),
          complete: allClients.filter(client => client.status === 'complete').sort((a, b) => a.priority - b.priority),
        },
      });

      const response = await fetch("http://localhost:3001/api/v1/clients/update-positions", {
        method: 'POST',
        headers: {
          'Content-Type': "application/json"
        },
        body: JSON.stringify(allClients)
      });

      if (!response.ok) {
        throw new Error('Failed to update client positions');
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        const data = await response.json();
        console.log(data);
      } else {
        console.log('No JSON response');
      }

    } catch (error) {
      console.error("Error updating client positions", error);
    }
  }

  getClients = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/clients');
      const returnData = await response.json();
      this.setState({
        clients: {
          backlog: returnData.filter(client => client.status === 'backlog').sort((a, b) => a.priority - b.priority),
          inProgress: returnData.filter(client => client.status === 'in-progress').sort((a, b) => a.priority - b.priority),
          complete: returnData.filter(client => client.status === 'complete').sort((a, b) => a.priority - b.priority),
        },
      });
    } catch (error) {
      console.log("Error fetching data for the clients:", error);
    }
  }

  setupDragula = () => {
    const containers = [
      this.swimlanes.backlog.current,
      this.swimlanes.inProgress.current,
      this.swimlanes.complete.current
    ];

    const drake = Dragula(containers);

    drake.on('drag', (el) => {
      el.classList.add('dragging');
    });

    drake.on('dragend', (el) => {
      el.classList.remove('dragging');
      el.classList.remove('Card-grey', 'Card-blue', 'Card-green');

      const parent = el.closest('.Swimlane-column');
      if (parent) {
        const swimlaneClass = parent.className.split(' ')[1];
        if (swimlaneClass === 'backlog') {
          el.classList.add('Card-grey');
        } else if (swimlaneClass === 'inprogress') {
          el.classList.add('Card-blue');
        } else if (swimlaneClass === 'complete') {
          el.classList.add('Card-green');
        }
      }

      this.updateClientPositions();
    });

    containers.forEach(container => {
      container.addEventListener('touchmove', this.preventDefault, { passive: false });
    });
  }

  preventDefault = (e) => {
    e.preventDefault();
  }

  renderSwimlane(name, clients, ref) {
    const swimlaneClass = name.replace(/\s+/g, '').toLowerCase();
    return (
      <Swimlane className={swimlaneClass} name={name} clients={clients} dragulaRef={ref} />
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

/*import React from 'react';
import Card from './Card';
import './Swimlane.css';

export default class Swimlane extends React.Component {
  render() {
    const cards = this.props.clients.map(client => {
      return (
        <Card
          key={client.id}
          id={client.id}
          name={client.name}
          description={client.description}
          status={client.status}
        />
      );
    })
    return (
      // Adding class same as the name of the swimlane
      <div className={`Swimlane-column ${this.props.className}`}>
        <div className="Swimlane-title">{this.props.name}</div>
        <div className="Swimlane-dragColumn" ref={this.props.dragulaRef}>
          {cards}
        </div>
      </div>);
  }

}
*/