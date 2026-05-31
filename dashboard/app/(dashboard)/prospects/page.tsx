import Header from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/Badge';
import { Users, Plus, Search, Filter } from 'lucide-react';

const mockProspects = [
  { id: '1', name: 'Sarah Kim', email: 'sarah@techventures.com', title: 'CTO', company: 'TechVentures', industry: 'SaaS', status: 'meeting', techStack: ['React', 'Node.js', 'AWS'] },
  { id: '2', name: 'Mike Johnson', email: 'mike@growthlab.io', title: 'CEO', company: 'GrowthLab', industry: 'Marketing', status: 'replied', techStack: ['Python', 'Django'] },
  { id: '3', name: 'Emily Chen', email: 'emily@dataflow.ai', title: 'VP Engineering', company: 'DataFlow', industry: 'AI/ML', status: 'replied', techStack: ['Python', 'TensorFlow', 'GCP'] },
  { id: '4', name: 'James Park', email: 'james@shipfast.dev', title: 'Founder', company: 'ShipFast', industry: 'DevTools', status: 'contacted', techStack: ['Go', 'React', 'Kubernetes'] },
  { id: '5', name: 'Lisa Wang', email: 'lisa@cloudscale.io', title: 'Head of Product', company: 'CloudScale', industry: 'Infrastructure', status: 'contacted', techStack: ['TypeScript', 'AWS'] },
  { id: '6', name: 'David Brown', email: 'david@finpay.com', title: 'CTO', company: 'FinPay', industry: 'FinTech', status: 'new', techStack: ['Java', 'Spring', 'Azure'] },
  { id: '7', name: 'Anna Martinez', email: 'anna@healthio.com', title: 'VP Product', company: 'HealthIO', industry: 'Healthcare', status: 'new', techStack: ['React Native', 'Node.js'] },
  { id: '8', name: 'Tom Wilson', email: 'tom@retailx.com', title: 'CEO', company: 'RetailX', industry: 'E-commerce', status: 'new', techStack: ['Shopify', 'Next.js'] },
];

export default function ProspectsPage() {
  return (
    <>
      <Header title="Prospects" />
      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, company, email..."
                className="w-80 pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:border-brand-300 focus:ring-1 focus:ring-brand-300"
              />
            </div>
            <button className="btn-secondary gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
          <button className="btn-primary gap-2">
            <Plus className="h-4 w-4" />
            Add Prospect
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-4">
          {['all', 'new', 'contacted', 'replied', 'meeting', 'closed'].map((status) => (
            <button
              key={status}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                status === 'all'
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1.5 text-xs text-gray-400">
                {status === 'all' ? mockProspects.length : mockProspects.filter(p => p.status === status).length}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  <input type="checkbox" className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Prospect</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Company</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Industry</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Tech Stack</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockProspects.map((prospect) => (
                <tr key={prospect.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                        {prospect.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{prospect.name}</p>
                        <p className="text-xs text-gray-500">{prospect.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{prospect.company}</p>
                    <p className="text-xs text-gray-500">{prospect.title}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{prospect.industry}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {prospect.techStack.slice(0, 2).map(tech => (
                        <span key={tech} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          {tech}
                        </span>
                      ))}
                      {prospect.techStack.length > 2 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                          +{prospect.techStack.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={prospect.status} />
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
