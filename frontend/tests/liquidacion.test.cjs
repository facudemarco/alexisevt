const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync(require.resolve('../src/lib/liquidacion.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const helper = { exports: {} };
new Function('exports', compiled.outputText)(helper.exports);
const { adicionalesLiquidacion, previewComision } = helper.exports;

test('desglosa adicionales sin duplicar el total y respeta comisión explícita o predeterminada', () => {
  const items = adicionalesLiquidacion([
    { nombre: 'Bus cama', valor: '200', aplica_comision: true },
    { nombre: 'Gastos', valor: 100, aplica_comision: false },
    { nombre: 'Otro', valor: 50 },
  ], 350, 2);
  assert.equal(items.length, 3);
  const subtotal = items.reduce((sum, item) => sum + Number(item.precio) * item.cant_pax, 0);
  const base = items.filter(item => item.aplica_comision).reduce((sum, item) => sum + Number(item.precio) * item.cant_pax, 0);
  assert.equal(subtotal, 700);
  assert.equal(base, 500);
  assert.deepEqual(previewComision('20', 15, base, subtotal, 100), { comision: 100, saldo: 500 });
});

test('conserva adicionales de paquetes antiguos y permite eliminar todos', () => {
  assert.deepEqual(adicionalesLiquidacion(undefined, 20, 1), [
    { descripcion: 'Adicional', precio: '20', cant_pax: 1, aplica_comision: true },
  ]);
  assert.deepEqual(adicionalesLiquidacion([], 0, 1), []);
});

test('porcentajes inválidos conservan valores guardados; cero y decimales recalculan saldo', () => {
  for (const invalid of ['', '-1', '101', 'abc']) {
    assert.deepEqual(previewComision(invalid, 15, 100, 150, 10), { comision: 15, saldo: 125 });
  }
  assert.deepEqual(previewComision('0', 15, 100, 150, 10), { comision: 0, saldo: 140 });
  assert.deepEqual(previewComision('12.5', 15, 100, 150, 10), { comision: 12.5, saldo: 127.5 });
});
