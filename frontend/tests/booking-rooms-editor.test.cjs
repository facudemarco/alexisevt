const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');

const source = fs.readFileSync(require.resolve('../src/components/booking-rooms-editor.tsx'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } });
const moduleObject = { exports: {} };
new Function('exports', 'require', compiled.outputText)(moduleObject.exports, require);
const { RoomsEditor, validateRooms } = moduleObject.exports;

function findElements(node, predicate) {
  if (Array.isArray(node)) return node.flatMap((child) => findElements(child, predicate));
  if (!React.isValidElement(node)) return [];
  return [...(predicate(node) ? [node] : []), ...findElements(node.props.children, predicate)];
}

test('asignación respeta capacidad y quitar una habitación pide confirmación', () => {
  let rooms = [{ clave: 'a', identificacion: 'Doble', tipo: 'Doble', capacidad: 2, observaciones: '' }];
  let passengers = [
    { nombre: 'Ana', apellido: 'A', habitacion_clave: 'a' },
    { nombre: 'Beto', apellido: 'B', habitacion_clave: 'a' },
    { nombre: 'Celia', apellido: 'C', habitacion_clave: '' },
  ];
  let confirmation = false;
  let prompts = 0;
  global.window = { confirm: () => { prompts++; return confirmation; } };
  const render = () => RoomsEditor({ rooms, passengers,
    setRooms: (change) => { rooms = change(rooms); },
    setPassengers: (change) => { passengers = change(passengers); },
  });
  const tree = render();
  const selects = findElements(tree, (element) => element.type === 'select');
  const optionsForThird = findElements(selects[2], (element) => element.type === 'option');
  assert.equal(optionsForThird[1].props.disabled, true);
  const remove = findElements(tree, (element) => element.type === 'button' && element.props.children === 'Quitar habitación')[0];
  remove.props.onClick();
  assert.equal(prompts, 1);
  assert.equal(rooms.length, 1);
  assert.equal(passengers[0].habitacion_clave, 'a');
  confirmation = true;
  remove.props.onClick();
  assert.equal(rooms.length, 0);
  assert.deepEqual(passengers.map((p) => p.habitacion_clave), ['', '', '']);
  delete global.window;
});

test('valida capacidad, tipo e identificación', () => {
  const room = { clave: 'a', identificacion: 'Doble', tipo: 'Doble', capacidad: 1, observaciones: '' };
  const people = [{ nombre: 'Ana', apellido: 'A', habitacion_clave: 'a' }, { nombre: 'Beto', apellido: 'B', habitacion_clave: 'a' }];
  assert.match(validateRooms([room], people), /capacidad/);
  assert.match(validateRooms([{ ...room, identificacion: ' ' }], []), /identificación/);
  assert.equal(validateRooms([{ ...room, capacidad: 2 }], people), null);
});
