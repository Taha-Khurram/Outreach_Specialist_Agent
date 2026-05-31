import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('Apollo Service', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  it('mapToProspect returns correct structure', async () => {
    const { mapToProspect } = await import('../src/services/apollo.js');
    const person = {
      id: '123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      title: 'CTO',
      organization: {
        name: 'Acme Corp',
        industry: 'SaaS',
        technologies: ['React', 'Node.js'],
        latest_funding_round_type: 'Series A',
        latest_funding_amount: 5000000,
        last_funding_at: '2026-01-15',
        estimated_num_employees: 50
      },
      linkedin_url: 'https://linkedin.com/in/johndoe'
    };

    const prospect = mapToProspect(person);

    assert.equal(prospect.id, '123');
    assert.equal(prospect.name, 'John Doe');
    assert.equal(prospect.firstName, 'John');
    assert.equal(prospect.email, 'john@example.com');
    assert.equal(prospect.company, 'Acme Corp');
    assert.equal(prospect.industry, 'SaaS');
    assert.deepEqual(prospect.techStack, ['React', 'Node.js']);
    assert.equal(prospect.funding, 'Series A');
    assert.equal(prospect.status, 'new');
  });

  it('mapToProspect handles null input', async () => {
    const { mapToProspect } = await import('../src/services/apollo.js');
    assert.equal(mapToProspect(null), null);
  });

  it('mapToProspect handles missing organization', async () => {
    const { mapToProspect } = await import('../src/services/apollo.js');
    const person = {
      id: '456',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      title: 'CEO'
    };

    const prospect = mapToProspect(person);
    assert.equal(prospect.company, '');
    assert.deepEqual(prospect.techStack, []);
  });
});
