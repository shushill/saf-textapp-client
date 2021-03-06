import React, { Component } from "react";
import { Switch } from "react-router-dom";
import config from "../../config";
import moment from "moment";
import TokenService from "../../services/token-service";
import PrivateRoute from "../../utils/PrivateRoute";
import DashNavBar from "../../components/NavBarDash/NavBarDash";
import CreateMessage from "../../views/CreateMessage/CreateMessage";
import Dashboard from "../../views/Dashboard/Dashboard";
import EditMessage from "../../views/EditMessage/EditMessage";
import MessagesContext from "../../MessagesContext";
import LoginContext from "../../LoginContext";
import ProfileCard from "../ProfileCard/ProfileCard";
import PopUpModal from "../PopUpModal/PopUpModal";

import "./Admin.css";

export default class DemoAdmin extends Component {
  state = {
    messages: [],
    queuedMessages: [],
    active: [],
    editUserToggle: false,
    error: null,
    loaded: false,
    demo: false,
    subscriptionId: null,
  };

  async componentDidMount() {
    TokenService.saveAuthToken(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJhdG9yX2lkIjoxLCJpYXQiOjE1OTMwNjQ4OTIsInN1YiI6Ik15bG9fTWVzc2FnZV9Cb3QifQ.CdcNXvk2rkvl83g3bkvYsuJH9UOcvrtufmL_siCKkP0"
    );
    await this.getUserData().then((user) => {
      this.setState({
        ...this.state,
        loaded: true,
      });
    });
    await this.getMessages(this.state.active.id);
    this.runDemo();
  }

  componentWillUnmount() {
    Promise.all([
      console.log("Purging"),
      this.deleteAllDemoMessages(),
      this.deleteSubscription(),
    ]).then(() => {
      TokenService.clearAuthToken();
    });
  }

  runDemo = async () => {
    this.setState({
      ...this.state,
      demo: true,
    });
  };

  deleteSubscription = () => {
    if (!this.state.subscriptionId) {
      return;
    }
    console.log(this.state.subscriptionId);
    fetch(`${config.API_ENDPOINT}/subscribers/${this.state.subscriptionId}`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((error) => {
            throw error;
          });
        }
        return res;
      })
      .catch((err) => console.log(err));
  };

  deleteAllDemoMessages = async () => {
    this.state.messages.map(async (message) => {
      await this.deleteDemoMessage(message.id);
    });
    return;
  };

  deleteDemoMessage = async (messageId) => {
    fetch(`${config.API_ENDPOINT}/messages/${messageId}`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        authorization: `bearer ${TokenService.getAuthToken()}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((error) => {
            throw error;
          });
        }
        return res;
      })
      .then((res) => {
        return;
      })
      .catch((err) => console.error(err));
  };

  getUserData = async () => {
    fetch(`${config.API_ENDPOINT}/users`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        authorization: `bearer ${TokenService.getAuthToken()}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.status);
        }
        return res.json();
      })
      .then((user) => {
        this.setActiveUser(user);
        return user;
      })
      .catch((error) => this.setState({ error }));
  };

  setActiveUser = (active) => {
    this.setState({
      ...this.state,
      active,
    });
  };

  setDemoSubId = (subscriber) => {
    console.log(subscriber);
    this.setState({
      ...this.state,
      subscriptionId: subscriber.id,
    });
  };

  getMessages = async (curator_id) => {
    fetch(`${config.API_ENDPOINT}/messages/curator/${curator_id}`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        authorization: `bearer ${TokenService.getAuthToken()}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.status);
        }
        return res.json();
      })
      .then((messages) => {
        this.setMessages(messages);
        this.setPendingMessages(messages);
      })
      .catch((error) => this.setState({ error }));
  };

  setMessages = (messages) => {
    this.setState({
      ...this.state,
      messages,
    });
  };

  setPendingMessages = (messages) => {
    const queuedMessages = messages.filter((message) => {
      return moment.utc(message.scheduled).format() > moment.utc().format();
    });
    this.setState({
      ...this.state,
      queuedMessages,
    });
  };
  addMessage = (message) => {
    this.setState({
      ...this.state,
      messages: [...this.state.messages, message],
    });
  };

  deleteMessage = (messageId) => {
    const newMessages = this.state.messages.filter(
      (message) => message.id !== messageId
    );
    this.setState({
      ...this.state,
      messages: newMessages,
    });
  };

  editMessage = (newData, id) => {
    const newMessages = this.state.messages.map((msg) =>
      msg.id === id ? newData : msg
    );
    this.setState({
      ...this.state,
      messages: newMessages,
    });
  };

  toggleEditView = () => {
    this.setState({
      ...this.state,
      editUserToggle: !this.state.editUserToggle,
    });
  };

  showDemoModal = () => {
    this.setState({
      ...this.state,
      demo: !this.state.demo,
    });
  };

  handleDeleteUser = () => {
    this.props.history.push("/");
  };

  editUser = () => {
    this.props.history.push("/dashboard");
  };

  render() {
    const demo = !this.state.active.id ? null : (
      <PopUpModal onClose={this.showDemoModal} show={this.state.demo}>
        <div className="demo-popup">
          <div className="welcome-section">
            <p className="welcome-text">
              Welcome to Start a Fire{" "}
              <span role="img" aria-label="Fire">
                🔥
              </span>
              !
            </p>
            <p className="demo-explainer">
              First, subscribe to Mylo the Message Bot in order to recieve text
              messages. Then, create a message, and schedule for it to be sent
              in the next minute or so to all of your subscribers. It's that
              simple! You can send information, links to important resources, or
              a motivational note.
            </p>
          </div>
          <div className="demo-card">
            <ProfileCard
              name={this.state.active.full_name}
              description={this.state.active.profile_description}
              profileImg={this.state.active.profile_img_link}
              curator_id={this.state.active.id}
              demo={true}
              callback={this.setDemoSubId}
            />
          </div>
          <p className="demo-caption">
            This is your profile card. Your profile card is how the public sees
            you. Subscribe to yourself to try it out.
            <br />
            Note: Your phone number will be deleted after this demo ends.
          </p>
        </div>
      </PopUpModal>
    );

    const MessagesContextVal = {
      messages: this.state.messages,
      deleteMessage: this.deleteMessage,
      addMessage: this.addMessage,
      editMessage: this.editMessage,
    };
    const LoginContextVal = {
      active: this.state.active.user,
      toggleEditView: this.toggleEditView,
      editUser: this.editUser,
      deleteUser: this.handleDeleteUser,
    };

    if (!this.state.loaded) {
      return <div />;
    }
    return (
      <>
        {demo}
        <header>
          <p onClick={() => this.showDemoModal()} className="header-comment">
            Welcome to Start a{" "}
            <span role="img" aria-label="Fire">
              🔥
            </span>{" "}
            Demo!
          </p>
          <DashNavBar user={this.state.active} toggleEditView={() => {}} />
        </header>
        <main className="Dashboard">
          <LoginContext.Provider value={LoginContextVal}>
            <MessagesContext.Provider value={MessagesContextVal}>
              <PrivateRoute
                exact
                path="/demo"
                component={() => (
                  <Dashboard active={this.state.active} demo={true} />
                )}
              />
              <Switch>
                <PrivateRoute
                  exact
                  path="/demo/edit-message/:id"
                  component={EditMessage}
                />
                <PrivateRoute
                  exact
                  path="/demo/create-message"
                  component={() => (
                    <CreateMessage active={this.state.active} demo={true} />
                  )}
                />
              </Switch>
            </MessagesContext.Provider>
          </LoginContext.Provider>
        </main>
      </>
    );
  }
}
