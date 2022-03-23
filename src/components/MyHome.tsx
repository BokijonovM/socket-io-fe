import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Form, ListGroup, Button } from "react-bootstrap";
import { io } from "socket.io-client";
import { FormEvent, KeyboardEventHandler, useEffect, useState } from "react";
import User from "../types/IUser";
import Message from "../types/IMessage";
import { TRoom } from "../types/TRoom";
import "./style.css";

const ADDRESS = "http://localhost:3030";
const socket = io(ADDRESS, { transports: ["websocket"] });

const MyHome = () => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  const [room, setRoom] = useState<TRoom>("blue");

  useEffect(() => {
    socket.on("connect", () => {
      console.log("connection established!");
    });

    socket.on("loggedin", () => {
      console.log("You're correctly logged in now");
      setIsLoggedIn(true);
      fetchOnlineUsers();

      socket.on("newConnection", () => {
        console.log("Look! another client connected!");
        fetchOnlineUsers();
      });

      socket.on("disconnectedUser", () => {
        console.log("Another client disconnected, refreshing the list...");
        fetchOnlineUsers();
      });

      socket.on("message", (newMessage: Message) => {
        setChatHistory((currentChatHistory) => [
          ...currentChatHistory,
          newMessage,
        ]);
      });
    });
  }, []);

  const handleUsernameSubmit = (e: FormEvent) => {
    e.preventDefault();
    socket.emit("setUsername", {
      username,
      room,
    });
  };

  const fetchOnlineUsers = async () => {
    try {
      let response = await fetch(ADDRESS + "/online-users");
      if (response.ok) {
        let data = await response.json();
        console.log("online users: ", data);
        let users = data.onlineUsers;
        setOnlineUsers(users);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleMessageSubmit = (e: FormEvent) => {
    e.preventDefault();

    const messageToSend: Message = {
      text: message,
      sender: username,
      id: socket.id,
      timestamp: Date.now(),
    };

    socket.emit("sendmessage", { message: messageToSend, room });
    setChatHistory([...chatHistory, messageToSend]);
    setMessage("");
  };

  const handleToggleRoom = () => {
    setRoom((room) => (room === "blue" ? "red" : "blue"));
  };

  return (
    <Container fluid className="px-4 mt-3">
      <Row style={{ height: "95vh" }}>
        <Col md={3} className="col-1-inside-row">
          <div className="mb-3 py-3 connected-users">Connected users:</div>
          <ListGroup>
            {onlineUsers
              .filter((user) => user.room === room)
              .map((user) => (
                <ListGroup.Item key={user.id}>{user.username}</ListGroup.Item>
              ))}
          </ListGroup>
        </Col>
        <Col md={9} className="d-flex flex-column justify-content-between">
          <div>
            <ListGroup>
              {onlineUsers
                .filter((user) => user.room === room)
                .map((user) => (
                  <ListGroup.Item key={user.id}>
                    <span className="text-muted mr-4">{user.username}:</span>
                    {user.id}
                  </ListGroup.Item>
                ))}
            </ListGroup>
            <Form onSubmit={handleUsernameSubmit} className="d-flex mt-2">
              <Form.Control
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoggedIn}
              />
              <Button
                className="ml-2"
                onClick={handleToggleRoom}
                variant={room === "blue" ? "primary" : "danger"}
                disabled={isLoggedIn}
              >
                Room
              </Button>
            </Form>
          </div>
          <ListGroup>
            {chatHistory.map((message) => (
              <ListGroup.Item key={message.timestamp} className="d-flex">
                <strong className="d-inline-block min-width-80">
                  {message.sender}
                </strong>
                {message.text}
                <span className="ml-auto text-muted">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </ListGroup.Item>
            ))}
          </ListGroup>
          <Form onSubmit={handleMessageSubmit}>
            <Form.Control
              type="text"
              placeholder="Enter your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!isLoggedIn}
            />
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default MyHome;
