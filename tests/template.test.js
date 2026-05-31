import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Email Template', () => {
  it('renders cold-email template with all fields', () => {
    const source = readFileSync(resolve(__dirname, '../src/templates/cold-email.hbs'), 'utf-8');
    const template = Handlebars.compile(source);

    const result = template({
      firstName: 'Sarah',
      company: 'TechCorp',
      industry: 'FinTech',
      funding: 'Series B',
      techStack: 'React, Python, AWS'
    });

    assert.ok(result.includes('Sarah'));
    assert.ok(result.includes('TechCorp'));
    assert.ok(result.includes('FinTech'));
    assert.ok(result.includes('Series B'));
    assert.ok(result.includes('React, Python, AWS'));
  });

  it('renders without optional fields', () => {
    const source = readFileSync(resolve(__dirname, '../src/templates/cold-email.hbs'), 'utf-8');
    const template = Handlebars.compile(source);

    const result = template({
      firstName: 'Mike',
      company: 'StartupXYZ',
      industry: 'Healthcare'
    });

    assert.ok(result.includes('Mike'));
    assert.ok(result.includes('StartupXYZ'));
    assert.ok(!result.includes('congrats on the'));
  });
});
