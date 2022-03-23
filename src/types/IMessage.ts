interface Message {
  text: string; // the content of the message
  sender: string; // the username of the person who sent the message
  id: string; // the socket we're sending the message from
  timestamp: number; // the number of ms elapsed from 01/01/1970
}

export default Message;
