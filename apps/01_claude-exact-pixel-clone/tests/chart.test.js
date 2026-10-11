import test from 'node:test'
import assert from 'node:assert/strict'
import { chartGeometry, parseChartSpec } from '../src/lib/chart.js'

test('a valid bar or line spec parses and keeps labels as strings', () => {
  assert.deepEqual(parseChartSpec('{"type":"bar","title":"Sales","labels":["Mon",2],"values":[4,9.5]}'), {
    type: 'bar', title: 'Sales', labels: ['Mon', '2'], values: [4, 9.5],
  })
  assert.equal(parseChartSpec('{"type":"line","labels":["a"],"values":[0]}').type, 'line')
})

test('invalid chart specs are rejected instead of rendered', () => {
  const bad = [
    'not json',
    '[]',
    '{"type":"pie","labels":["a"],"values":[1]}',
    '{"type":"bar","labels":["a","b"],"values":[1]}',
    '{"type":"bar","labels":[],"values":[]}',
    '{"type":"bar","labels":["a"],"values":["1"]}',
    '{"type":"bar","labels":["a"],"values":[1e999]}',
    '{"type":"bar","labels":' + JSON.stringify(Array.from({ length: 31 }, (_, i) => 'x' + i)) + ',"values":' + JSON.stringify(Array.from({ length: 31 }, () => 1)) + '}',
  ]
  for (const source of bad) assert.equal(parseChartSpec(source), null, source)
})

test('long labels are truncated and titles are capped', () => {
  const spec = parseChartSpec(JSON.stringify({ type: 'bar', title: 'T'.repeat(200), labels: ['L'.repeat(100)], values: [1] }))
  assert.equal(spec.title.length, 80)
  assert.equal(spec.labels[0].length, 40)
})

test('bar geometry keeps bars inside the plot and scales to the largest value', () => {
  const spec = parseChartSpec('{"type":"bar","labels":["a","b","c"],"values":[4,9,6]}')
  const geo = chartGeometry(spec)
  const tallest = geo.points[1]
  assert.ok(tallest.barH > geo.points[0].barH && tallest.barH > geo.points[2].barH)
  for (const point of geo.points) {
    assert.ok(point.barTop >= geo.pad - 0.001)
    assert.ok(point.barTop + point.barH <= geo.height - geo.pad + 0.001)
  }
})

test('negative values put the zero baseline inside the plot', () => {
  const geo = chartGeometry(parseChartSpec('{"type":"line","labels":["a","b"],"values":[-3,5]}'))
  assert.ok(geo.zeroY > geo.pad && geo.zeroY < geo.height - geo.pad)
})

import { systemPrompt } from "../src/lib/ollama.js"
test("the system prompt tells the model the chart block format", () => {
  assert.match(systemPrompt(), /fenced chart code block/)
})
