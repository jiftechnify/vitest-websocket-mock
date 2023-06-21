/**
 * @copyright Romain Bertrand 2018
 * @copyright Akiomi Kamakura 2023
 */

import '../matchers';

import chalk from 'chalk';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { deriveToHaveReceivedMessage, deriveToReceiveMessage } from '../matchers';
import WS from '../websocket';

let server: WS, client: WebSocket;
beforeEach(async () => {
  server = new WS('ws://localhost:1234');
  client = new WebSocket('ws://localhost:1234');
  await server.connected;
});

afterEach(() => {
  WS.clean();
});

describe('.toReceiveMessage', () => {
  it('passes when the websocket server receives the expected message', async () => {
    client.send('hello there');
    await expect(server).toReceiveMessage('hello there');
  });

  it('passes when the websocket server receives the expected message with custom timeout', async () => {
    setTimeout(() => {
      client.send('hello there');
    }, 2000);

    await expect(server).toReceiveMessage('hello there', { timeout: 3000 });
  });

  it('passes when the websocket server receives the expected JSON message', async () => {
    const jsonServer = new WS('ws://localhost:9876', { jsonProtocol: true });
    const jsonClient = new WebSocket('ws://localhost:9876');
    await jsonServer.connected;
    jsonClient.send(`{"answer":42}`);
    await expect(jsonServer).toReceiveMessage({ answer: 42 });
  });

  it('fails when called with an expected argument that is not a valid WS', async () => {
    expect.hasAssertions();
    await expect(expect('boom').toReceiveMessage('hello there')).rejects.toThrowErrorMatchingInlineSnapshot(`
"[2mexpect([22m[31mWS[39m[2m).toReceiveMessage([22m[32mexpected[39m[2m)[22m

Expected the websocket object to be a valid WS mock.
Received: string
  [31m\\"boom\\"[39m"
`);
  });

  it('fails when the WS server does not receive the expected message', async () => {
    expect.hasAssertions();
    await expect(expect(server).toReceiveMessage('hello there')).rejects.toThrowErrorMatchingInlineSnapshot(`
"[2mexpect([22m[31mWS[39m[2m).toReceiveMessage([22m[32mexpected[39m[2m)[22m

Expected the websocket server to receive a message,
but it didn't receive anything in 1000ms."
`);
  });

  it('fails when the WS server does not receive the expected message with custom timeout', async () => {
    expect.hasAssertions();
    await expect(expect(server).toReceiveMessage('hello there', { timeout: 3000 })).rejects.toThrowErrorMatchingInlineSnapshot(`
"[2mexpect([22m[31mWS[39m[2m).toReceiveMessage([22m[32mexpected[39m[2m)[22m

Expected the websocket server to receive a message,
but it didn't receive anything in 3000ms."
`);
  });

  it('fails when the WS server receives a different message', async () => {
    expect.hasAssertions();
    client.send('hello there');
    await expect(expect(server).toReceiveMessage('HI!')).rejects.toThrowErrorMatchingInlineSnapshot(`
"[2mexpect([22m[31mWS[39m[2m).toReceiveMessage([22m[32mexpected[39m[2m)[22m

Expected the next received message to equal:
  [32m\\"HI!\\"[39m
Received:
  [31m\\"hello there\\"[39m

Difference:

${chalk.green('- Expected')}
${chalk.red('+ Received')}

${chalk.green('- HI!')}
${chalk.red('+ hello there')}"
`);
  });

  // TODO: Fix Object indentation
  it('fails when expecting a JSON message but the server is not configured for JSON protocols', async () => {
    expect.hasAssertions();
    client.send(`{"answer":42}`);
    await expect(expect(server).toReceiveMessage({ answer: 42 })).rejects.toThrowErrorMatchingInlineSnapshot(`
"[2mexpect([22m[31mWS[39m[2m).toReceiveMessage([22m[32mexpected[39m[2m)[22m

Expected the next received message to equal:
  [32mObject {
  \\"answer\\": 42,
}[39m
Received:
  [31m\\"{\\"answer\\":42}\\"[39m

Difference:

  Comparing two different types of values. Expected ${chalk.green('object')} but received ${chalk.red('string')}."
`);
  });
});

describe('.not.toReceiveMessage', () => {
  it("passes when the websocket server doesn't receive the expected message", async () => {
    client.send('hello there');
    await expect(server).not.toReceiveMessage("What's up?");
  });

  it('fails when called with an expected argument that is not a valid WS', async () => {
    expect.hasAssertions();
    await expect(expect('boom').not.toReceiveMessage('hello there')).rejects.toThrowErrorMatchingInlineSnapshot(`
"[2mexpect([22m[31mWS[39m[2m).not.toReceiveMessage([22m[32mexpected[39m[2m)[22m

Expected the websocket object to be a valid WS mock.
Received: string
  [31m\\"boom\\"[39m"
`);
  });

  it("fails when the WS server doesn't receive any messages", async () => {
    expect.hasAssertions();
    await expect(expect(server).not.toReceiveMessage('hello there')).rejects.toThrowErrorMatchingInlineSnapshot(`
"[2mexpect([22m[31mWS[39m[2m).not.toReceiveMessage([22m[32mexpected[39m[2m)[22m

Expected the websocket server to receive a message,
but it didn't receive anything in 1000ms."
`);
  });

  it('fails when the WS server receives the un-expected message', async () => {
    expect.hasAssertions();
    client.send('hello there');
    await expect(expect(server).not.toReceiveMessage('hello there')).rejects.toThrowErrorMatchingInlineSnapshot(`
"[2mexpect([22m[31mWS[39m[2m).not.toReceiveMessage([22m[32mexpected[39m[2m)[22m

Expected the next received message to not equal:
  [32m\\"hello there\\"[39m
Received:
  [31m\\"hello there\\"[39m"
`);
  });
});

describe('.toHaveReceivedMessages', () => {
  it('passes when the websocket server received the expected messages', async () => {
    client.send('hello there');
    client.send('how are you?');
    client.send('good?');
    await server.nextMessage;
    await server.nextMessage;
    await server.nextMessage;
    expect(server).toHaveReceivedMessages(['hello there', 'good?']);
  });

  it('passes when the websocket server received the expected JSON messages', async () => {
    const jsonServer = new WS('ws://localhost:9876', { jsonProtocol: true });
    const jsonClient = new WebSocket('ws://localhost:9876');
    await jsonServer.connected;
    jsonClient.send(`{"type":"GREETING","payload":"hello there"}`);
    jsonClient.send(`{"type":"GREETING","payload":"how are you?"}`);
    jsonClient.send(`{"type":"GREETING","payload":"good?"}`);
    await jsonServer.nextMessage;
    await jsonServer.nextMessage;
    await jsonServer.nextMessage;
    expect(jsonServer).toHaveReceivedMessages([
      { type: 'GREETING', payload: 'good?' },
      { type: 'GREETING', payload: 'hello there' },
    ]);
  });

  // TODO: Fix Array indentation
  it('fails when the websocket server did not receive the expected messages', async () => {
    client.send('hello there');
    client.send('how are you?');
    client.send('good?');
    await server.nextMessage;
    await server.nextMessage;
    await server.nextMessage;
    expect(() => {
      expect(server).toHaveReceivedMessages(['hello there', "'sup?"]);
    }).toThrowErrorMatchingInlineSnapshot(`
"[2mexpect([22m[31mWS[39m[2m).toHaveReceivedMessages([22m[32mexpected[39m[2m)[22m

Expected the WS server to have received the following messages:
  [32mArray [
  \\"hello there\\",
  \\"'sup?\\",
][39m
Received:
  [31mArray [
  \\"hello there\\",
  \\"how are you?\\",
  \\"good?\\",
][39m

"
`);
  });

  it('fails when called with an expected argument that is not a valid WS', async () => {
    expect(() => {
      expect('boom').toHaveReceivedMessages(['hello there']);
    }).toThrowErrorMatchingInlineSnapshot(`
"[2mexpect([22m[31mWS[39m[2m).toHaveReceivedMessages([22m[32mexpected[39m[2m)[22m

Expected the websocket object to be a valid WS mock.
Received: string
  [31m\\"boom\\"[39m"
`);
  });
});

describe('.not.toHaveReceivedMessages', () => {
  it('passes when the websocket server received none of the specified messages', async () => {
    client.send('hello there');
    client.send('how are you?');
    client.send('good?');
    await server.nextMessage;
    await server.nextMessage;
    await server.nextMessage;
    expect(server).not.toHaveReceivedMessages(["'sup?", 'U good?']);
  });

  it('fails when the websocket server received at least one unexpected message', async () => {
    client.send('hello there');
    client.send('how are you?');
    client.send('good?');
    await server.nextMessage;
    await server.nextMessage;
    await server.nextMessage;
    expect(() => {
      expect(server).not.toHaveReceivedMessages(["'sup?", 'U good?', 'hello there']);
    }).toThrowErrorMatchingInlineSnapshot(`
"[2mexpect([22m[31mWS[39m[2m).not.toHaveReceivedMessages([22m[32mexpected[39m[2m)[22m

Expected the WS server to not have received the following messages:
  [32mArray [
  \\"'sup?\\",
  \\"U good?\\",
  \\"hello there\\",
][39m
But it received:
  [31mArray [
  \\"hello there\\",
  \\"how are you?\\",
  \\"good?\\",
][39m"
`);
  });

  it('fails when called with an expected argument that is not a valid WS', async () => {
    expect(() => {
      expect('boom').not.toHaveReceivedMessages(['hello there']);
    }).toThrowErrorMatchingInlineSnapshot(`
"[2mexpect([22m[31mWS[39m[2m).not.toHaveReceivedMessages([22m[32mexpected[39m[2m)[22m

Expected the websocket object to be a valid WS mock.
Received: string
  [31m\\"boom\\"[39m"
`);
  });
});

describe('A custom matcher `toReceiveHello` derived from toReceiveMessage', () => {
  expect.extend({
    toReceiveHello: deriveToReceiveMessage('toReceiveHello', function (received) {
      const pass = received === 'Hello';
      const message = pass
        ? () => `Expected the next received message is not Hello, but got ${received}`
        : () => `Expected the next received message is Hello, but got ${received}`;

      return {
        actual: received,
        expected: 'Hello',
        message,
        pass,
      };
    }),
  });

  it('passes when received "Hello"', async () => {
    client.send('Hello');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (expect(server) as any).toReceiveHello();
  });

  it('fails when received "Hi!"', async () => {
    client.send('Hi!');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect((expect(server) as any).toReceiveHello()).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Expected the next received message is Hello, but got Hi!"'
    );
  });

  it('fails when received "Hello" under .not context', async () => {
    client.send('Hello');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect((expect(server) as any).not.toReceiveHello()).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Expected the next received message is not Hello, but got Hello"'
    );
  });

  it('passes when received "Hi!" under .not context', async () => {
    client.send('Hi!');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (expect(server) as any).not.toReceiveHello();
  });
});

describe('A custom matcher `toHaveHello` derived from toHaveReceivedMessages', () => {
  expect.extend({
    toHaveHello: deriveToHaveReceivedMessage('toHaveHello', function (received) {
      const pass = received.includes('Hello');
      const message = pass
        ? () => `Expected the WS server to not have received Hello, but got ${received}`
        : () => `Expected the WS server to have received Hello, but got ${received}`;

      return {
        actual: received,
        expected: ['Hello'],
        message,
        pass,
      };
    }),
  });

  it('passes when received "Hello"', async () => {
    client.send('Hi!');
    client.send('Hello');
    await server.nextMessage;
    await server.nextMessage;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (expect(server) as any).toHaveHello();
  });

  it('fails when not received "Hello"', async () => {
    client.send('Hi!');
    client.send('Yo');
    await server.nextMessage;
    await server.nextMessage;
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (expect(server) as any).toHaveHello();
    }).toThrowErrorMatchingInlineSnapshot('"Expected the WS server to have received Hello, but got Hi!,Yo"');
  });

  it('fails when received "Hello" under .not context', async () => {
    client.send('Hi!');
    client.send('Hello');
    await server.nextMessage;
    await server.nextMessage;
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (expect(server) as any).not.toHaveHello();
    }).toThrowErrorMatchingInlineSnapshot('"Expected the WS server to not have received Hello, but got Hi!,Hello"');
  });

  it('passes when not received "Hello" under .not context', async () => {
    client.send('Hi!');
    client.send('Yo');
    await server.nextMessage;
    await server.nextMessage;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (expect(server) as any).not.toHaveHello();
  });
});
