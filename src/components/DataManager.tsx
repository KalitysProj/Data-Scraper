import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  Search, 
  Filter, 
  Eye,
  Trash2,
  Calendar,
  Building,
  ExternalLink,
  FileText,
  MapPin
} from 'lucide-react';

interface CompanyData {
  id: string;
  denomination: string;
  siren: string;
  startDate: string;
  representatives: string[];
  legalForm: string;
  establishments: number;
  department: string;
  apeCode: string;
  scrapedAt: string;
}

const mockData: CompanyData[] = [
  {
    id: '1',
    denomination: 'VIGNOBLES MARTIN SARL',
    siren: '123456789',
    startDate: '2015-03-12',
    representatives: ['Jean MARTIN', 'Marie MARTIN'],
    legalForm: 'SARL',
    establishments: 2,
    department: '69',
    apeCode: '0121Z',
    scrapedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    denomination: 'DOMAINE DES COTEAUX',
    siren: '987654321',
    startDate: '2018-07-08',
    representatives: ['Pierre DUBOIS'],
    legalForm: 'SAS',
    establishments: 1,
    department: '69',
    apeCode: '0121Z',
    scrapedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '3',
    denomination: 'CAVE COOPERATIVE LYONNAISE',
    siren: '456789123',
    startDate: '2010-11-20',
    representatives: ['Michel BERNARD', 'Sophie DURAND', 'Alain PETIT'],
    legalForm: 'COOP',
    establishments: 5,
    department: '69',
    apeCode: '0121Z',
    scrapedAt: '2024-01-15T10:30:00Z'
  }
];

export const DataManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewDetails, setViewDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'demo' | 'database'>('demo');

  const filteredData = mockData.filter(company =>
    company.denomination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.siren.includes(searchTerm) ||
    company.representatives.some(rep => rep.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectAll = () => {
    if (selectedRows.length === filteredData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredData.map(company => company.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const exportToCSV = () => {
    const dataToExport = selectedRows.length > 0 
      ? filteredData.filter(company => selectedRows.includes(company.id))
      : filteredData;

    const csvContent = [
      ['Dénomination', 'SIREN', 'Début d\'activité', 'Représentants', 'Forme juridique', 'Établissements', 'Département', 'Code APE'].join(','),
      ...dataToExport.map(company => [
        `"${company.denomination}"`,
        company.siren,
        company.startDate,
        `"${company.representatives.join('; ')}"`,
        company.legalForm,
        company.establishments.toString(),
        company.department,
        company.apeCode
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inpi_data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Données</h1>
        <p className="text-gray-600">Consultez, filtrez et exportez vos données d'entreprises</p>
        
        {/* Data Source Indicator */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${dataSource === 'demo' ? 'bg-orange-500' : 'bg-green-500'}`} />
            <span className="text-sm font-medium text-gray-700">
              {dataSource === 'demo' ? 'Données de démonstration' : 'Base de données connectée'}
            </span>
          </div>
          <button
            onClick={() => setDataSource(dataSource === 'demo' ? 'database' : 'demo')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {dataSource === 'demo' ? 'Connecter à la base de données' : 'Revenir au mode démo'}
          </button>
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">{filteredData.length} entreprises</span>
            </div>
            {selectedRows.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-600 font-medium">{selectedRows.length} sélectionnées</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
              {selectedRows.length > 0 && (
                <span className="bg-green-500 text-xs px-2 py-1 rounded-full">
                  {selectedRows.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`border border-gray-300 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors ${
                showFilters ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtres
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par dénomination, SIREN ou représentant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {showFilters && (
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forme juridique</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Toutes</option>
                  <option value="SARL">SARL</option>
                  <option value="SAS">SAS</option>
                  <option value="COOP">Coopérative</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Tous</option>
                  <option value="69">69 - Rhône</option>
                  <option value="75">75 - Paris</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code APE</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Tous</option>
                  <option value="0121Z">0121Z - Culture de la vigne</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-12 p-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="text-left p-4 font-medium text-gray-900">Dénomination</th>
                <th className="text-left p-4 font-medium text-gray-900">SIREN</th>
                <th className="text-left p-4 font-medium text-gray-900">Début d'activité</th>
                <th className="text-left p-4 font-medium text-gray-900">Représentants</th>
                <th className="text-left p-4 font-medium text-gray-900">Forme juridique</th>
                <th className="text-left p-4 font-medium text-gray-900">Établissements</th>
                <th className="text-center p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(company.id)}
                      onChange={() => handleSelectRow(company.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{company.denomination}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>Dép. {company.department}</span>
                          <span>•</span>
                          <span>{company.apeCode}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-sm text-gray-900">{company.siren}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(company.startDate).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {company.representatives.slice(0, 2).map((rep, idx) => (
                        <div key={idx} className="text-sm text-gray-900">{rep}</div>
                      ))}
                      {company.representatives.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{company.representatives.length - 2} autres
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {company.legalForm}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-900">{company.establishments}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setViewDetails(viewDetails === company.id ? null : company.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucune donnée trouvée</p>
            <p className="text-sm text-gray-400 mt-1">Modifiez vos critères de recherche ou lancez un nouveau scraping</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {viewDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Détails de l'entreprise</h3>
                <button
                  onClick={() => setViewDetails(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              {(() => {
                const company = filteredData.find(c => c.id === viewDetails);
                if (!company) return null;

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dénomination</label>
                        <p className="text-gray-900 font-medium">{company.denomination}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SIREN</label>
                        <p className="text-gray-900 font-mono">{company.siren}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Début d'activité</label>
                        <p className="text-gray-900">{new Date(company.startDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Forme juridique</label>
                        <p className="text-gray-900">{company.legalForm}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
                        <p className="text-gray-900">{company.department}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code APE</label>
                        <p className="text-gray-900">{company.apeCode}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Représentants</label>
                      <div className="space-y-2">
                        {company.representatives.map((rep, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-gray-900">
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                            {rep}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Établissements</label>
                        <p className="text-gray-900">{company.establishments}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Données collectées</label>
                        <p className="text-gray-500 text-sm">{new Date(company.scrapedAt).toLocaleString('fr-FR')}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};