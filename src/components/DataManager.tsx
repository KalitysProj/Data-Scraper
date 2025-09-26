import React, { useState } from 'react';
import { useEffect } from 'react';
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
  MapPin,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { apiService, CompanyData } from '../services/api';

export const DataManager: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    apeCode: '',
    legalForm: ''
  });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewDetails, setViewDetails] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0
  });

  useEffect(() => {
    loadCompanies();
  }, [searchTerm, filters, pagination]);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = {
        search: searchTerm,
        department: filters.department,
        apeCode: filters.apeCode,
        legalForm: filters.legalForm,
        limit: pagination.limit,
        offset: pagination.offset,
        sortBy: 'created_at',
        sortOrder: 'DESC'
      };

      const result = await apiService.getCompanies(params);
      setCompanies(result.companies);
      setTotal(result.total);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement des données');
      setCompanies([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.length === companies.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(companies.map(company => company.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      const companyIds = selectedRows.length > 0 ? selectedRows : undefined;
      const blob = await apiService.exportToCsv(companyIds);
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inpi_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'export');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSelectedCompanies = async () => {
    if (selectedRows.length === 0) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedRows.length} entreprise(s) ?`)) {
      return;
    }

    try {
      setIsLoading(true);
      await apiService.deleteCompanies(selectedRows);
      setSelectedRows([]);
      await loadCompanies();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (!apiService.isAuthenticated()) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentification requise</h2>
          <p className="text-gray-600">Vous devez être connecté pour accéder aux données.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Données</h1>
        <p className="text-gray-600">Consultez, filtrez et exportez vos données d'entreprises</p>
        
        {/* Connection Status */}
        <div className="mt-4 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-gray-700">
            Base de données connectée - Données réelles
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Stats & Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">{total} entreprises</span>
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
              disabled={isLoading}
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
            
            {selectedRows.length > 0 && (
              <button
                onClick={deleteSelectedCompanies}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer ({selectedRows.length})
              </button>
            )}
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`border border-gray-300 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors ${
                showFilters ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtres
            </button>
            
            <button
              onClick={loadCompanies}
              disabled={isLoading}
              className="border border-gray-300 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
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
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {showFilters && (
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forme juridique</label>
                <select 
                  value={filters.legalForm}
                  onChange={(e) => handleFilterChange('legalForm', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Toutes</option>
                  <option value="SARL">SARL</option>
                  <option value="SAS">SAS</option>
                  <option value="SA">SA</option>
                  <option value="EURL">EURL</option>
                  <option value="SNC">SNC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
                <select 
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tous</option>
                  <option value="01">01 - Ain</option>
                  <option value="13">13 - Bouches-du-Rhône</option>
                  <option value="69">69 - Rhône</option>
                  <option value="75">75 - Paris</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code APE</label>
                <input
                  type="text"
                  value={filters.apeCode}
                  onChange={(e) => handleFilterChange('apeCode', e.target.value.toUpperCase())}
                  placeholder="Ex: 0121Z"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Clear Filters */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setFilters({ department: '', apeCode: '', legalForm: '' });
                  setSearchTerm('');
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Effacer tous les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mr-3" />
            <span className="text-gray-600">Chargement des données...</span>
          </div>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-12 p-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === companies.length && companies.length > 0}
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
                {companies.map((company) => (
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
                            <span>{company.ape_code}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm text-gray-900">{company.siren}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {company.start_date ? formatDate(company.start_date) : 'N/A'}
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
                        {company.legal_form || 'N/A'}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {companies.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aucune donnée trouvée</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm || filters.department || filters.apeCode || filters.legalForm
                  ? 'Modifiez vos critères de recherche'
                  : 'Lancez un nouveau scraping pour commencer'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {total > pagination.limit && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Affichage de {pagination.offset + 1} à {Math.min(pagination.offset + pagination.limit, total)} sur {total} résultats
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
              disabled={pagination.offset === 0}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
              disabled={pagination.offset + pagination.limit >= total}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {viewDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Détails de l'entreprise</h3>
                <button
                  onClick={() => setViewDetails(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              {(() => {
                const company = companies.find(c => c.id === viewDetails);
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
                        <p className="text-gray-900">{company.start_date ? formatDate(company.start_date) : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Forme juridique</label>
                        <p className="text-gray-900">{company.legal_form || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
                        <p className="text-gray-900">{company.department}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code APE</label>
                        <p className="text-gray-900">{company.ape_code}</p>
                      </div>
                    </div>

                    {company.address && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                        <p className="text-gray-900">{company.address}</p>
                        {company.postal_code && company.city && (
                          <p className="text-gray-600 text-sm mt-1">{company.postal_code} {company.city}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Représentants</label>
                      <div className="space-y-2">
                        {company.representatives.length > 0 ? (
                          company.representatives.map((rep, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-gray-900">
                              <div className="w-2 h-2 bg-blue-600 rounded-full" />
                              {rep}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">Aucun représentant renseigné</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Établissements</label>
                        <p className="text-gray-900">{company.establishments}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Données collectées</label>
                        <p className="text-gray-500 text-sm">{formatDate(company.scraped_at)}</p>
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