const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation();
const Player = require("../../modules/player");
const ws = {
    send: jest.fn((msg) => msg)
};
const streamer = { ws };
const streamers = new Map();
const player = new Player("playerId", ws, 0, false, {});
streamers.set('streamer', streamer);

afterEach(()=> {
    ws.send.mockClear();
    consoleErrorMock.mockClear();
})

test("should subscribe player to streamer", async () => {
    player.subscribe(streamers, "streamer");
    expect(streamer.ws.send).toHaveBeenCalledWith('{"type":"playerConnected","playerId":"playerId","dataChannel":true,"sfu":false,"sendOffer":true}');
});

test("should fail to subscribe player to streamer if id is invalid", async () => {
    player.subscribe(streamers, "streamer1");
    expect(consoleErrorMock).toHaveBeenCalledWith("subscribe: Player playerId tried to subscribe to a non-existent streamer streamer1");
});

test("should unsubscribe player from streamer", async () => {
    player.unsubscribe(streamers);
    expect(streamer.ws.send).toHaveBeenCalledWith('{"type":"playerDisconnected","playerId":"playerId"}');
});

test("should send message to player ws", async () => {
    player.sendTo({msg: 'test'});
    expect(ws.send).toHaveBeenCalledWith('{"msg":"test"}');
});