const { log, err } = require('../logger');

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

test('log prefixes output with ISO timestamp', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  log('hello', 'world');
  expect(spy).toHaveBeenCalledWith(expect.stringMatching(ISO_RE), 'hello', 'world');
  spy.mockRestore();
});

test('err prefixes output with ISO timestamp', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  err('oops');
  expect(spy).toHaveBeenCalledWith(expect.stringMatching(ISO_RE), 'oops');
  spy.mockRestore();
});
