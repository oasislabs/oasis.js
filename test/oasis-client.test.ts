import DummyClass from '../src/oasis-client'

/**
 * Dummy test
 */
describe('Dummy test', () => {
  it('DummyClass is instantiable', () => {
    expect(new DummyClass('hi')).toBeInstanceOf(DummyClass)
  })
})
