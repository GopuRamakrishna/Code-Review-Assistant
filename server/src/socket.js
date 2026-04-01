const {Server}=require('socket.io');

let io;//singleton -created once in server.js,used everywhere


//called once from server.js to attach io to the HTTP server

function initSocket(httpServer){
    io = new Server(httpServer,{
        cors:{
            origin:'http://localhost:3000', //react dev server,
            methods:['GET','POST']
        }
    });
}


io?.on('connection',(socket)=>{
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    //client joins a room named after the repo
    //e.g "GopuRamakrishna/test_sample"
    //only clients watchin that repo get ist events

    socket.on('join:repo',(repoFullName)=>{
        socket.join(repoFullName);
        console.log(`[Socket.io] ${socket.id} joined room: ${repoFullName}`);
    
    });

    socket.on('disconnect',()=>{
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });

    console.log('[Socket.io] Server initialised');

    return io;

})



//helper used by worker and contollers to emit review events
//emits to the repo room so only clients watching that repo get the event

function emitReviewEvent(eventName,data){
    if(!io){
      console.warn('[Socket.io] io not initialised yet — skipping emit');
      return;    
    }

    const room=data.repo; //repoFullName is the room name
     
    //emit to the repo room +broadcast to all connected clients in that room
    io.to(room).emit(eventName,data);
    io.emit(eventName,data) ; //emit to all clients regardless of room (for dashboard)

    console.log(`[Socket.io] Emitted "${eventName}" → PR #${data.prNumber}`);

}



//export both -server.js uses initSocket to create the io instance, worker and controllers use emitReviewEvent to send events
module.exports={initSocket,emitReviewEvent};