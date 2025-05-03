import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFilePdf, FaFileWord, FaFileImage, FaFile, FaTrash, FaEye, FaDownload } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import FileViewer from './FileViewer';
import Modal from './Modal';
import api from '../services/api';
import config from '../config';
import '../styles/FileList.css';

const FileList = ({ residentId, canDelete = false }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/files/resident/${residentId}`);
        setFiles(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching files:', err);
        setError(t('fileList.errorLoading'));
        setLoading(false);
      }
    };

    if (residentId) {
      fetchFiles();
    }
  }, [residentId, t]);

  const handleViewFile = (file) => {
    setSelectedFile(file);
    setShowViewer(true);
  };

  const handleDownloadFile = async (file) => {
    try {
      const response = await api.get(`/files/${file.id}`, {
        responseType: 'blob'
      });
      
      // Create a URL for the blob
      const fileUrl = URL.createObjectURL(response.data);
      
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert(t('fileList.errorDownloading'));
    }
  };

  const handleDeleteClick = (file) => {
    setFileToDelete(file);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    
    try {
      await api.delete(`/files/${fileToDelete.id}`);
      setFiles(files.filter(f => f.id !== fileToDelete.id));
      setShowDeleteConfirm(false);
      setFileToDelete(null);
    } catch (err) {
      console.error('Error deleting file:', err);
      alert(t('fileList.errorDeleting'));
    }
  };

  const getFileIcon = (mimeType) => {
    const fileTypeConfig = config.fileStorage.allowedFileTypes[mimeType];
    
    if (!fileTypeConfig) return <FaFile />;
    
    switch (fileTypeConfig.icon) {
      case 'file-pdf':
        return <FaFilePdf />;
      case 'file-word':
        return <FaFileWord />;
      case 'file-image':
        return <FaFileImage />;
      default:
        return <FaFile />;
    }
  };

  const getCategoryLabel = (categoryId) => {
    const category = config.fileStorage.fileCategories.find(cat => cat.id === categoryId);
    return category ? category.label[i18n.language] || category.label.en : categoryId;
  };

  const getFilteredFiles = () => {
    if (activeCategory === 'all') {
      return files;
    }
    return files.filter(file => file.category === activeCategory);
  };

  const renderCategoryTabs = () => {
    const categories = [
      { id: 'all', label: { en: 'All Files', es: 'Todos los Archivos' } },
      ...config.fileStorage.fileCategories
    ];

    return (
      <div className="file-category-tabs">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-tab ${activeCategory === category.id ? 'active' : ''} ${theme}`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.label[i18n.language] || category.label.en}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="file-list-loading">{t('fileList.loading')}</div>;
  }

  if (error) {
    return <div className="file-list-error">{error}</div>;
  }

  const filteredFiles = getFilteredFiles();

  return (
    <div className={`file-list-container ${theme}`}>
      <h2 className="file-list-title">{t('fileList.title')}</h2>
      
      {renderCategoryTabs()}
      
      {filteredFiles.length === 0 ? (
        <div className="no-files-message">
          {activeCategory === 'all' 
            ? t('fileList.noFiles') 
            : t('fileList.noCategoryFiles', { category: getCategoryLabel(activeCategory) })}
        </div>
      ) : (
        <div className="file-grid">
          {filteredFiles.map(file => (
            <div key={file.id} className={`file-card ${theme}`}>
              <div className="file-icon">{getFileIcon(file.mimeType)}</div>
              <div className="file-details">
                <h3 className="file-name" title={file.filename}>
                  {file.filename.length > 20 
                    ? `${file.filename.substring(0, 17)}...` 
                    : file.filename}
                </h3>
                <p className="file-category">{getCategoryLabel(file.category)}</p>
                <p className="file-date">
                  {new Date(file.uploadedAt).toLocaleDateString(i18n.language)}
                </p>
                <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <div className="file-actions">
                <button 
                  className="file-action-button view"
                  onClick={() => handleViewFile(file)}
                  title={t('fileList.view')}
                >
                  <FaEye />
                </button>
                <button 
                  className="file-action-button download"
                  onClick={() => handleDownloadFile(file)}
                  title={t('fileList.download')}
                >
                  <FaDownload />
                </button>
                {canDelete && (
                  <button 
                    className="file-action-button delete"
                    onClick={() => handleDeleteClick(file)}
                    title={t('fileList.delete')}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* File Viewer Modal */}
      {showViewer && selectedFile && (
        <Modal onClose={() => setShowViewer(false)} fullWidth>
          <FileViewer 
            file={selectedFile} 
            onClose={() => setShowViewer(false)} 
          />
        </Modal>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && fileToDelete && (
        <Modal onClose={() => setShowDeleteConfirm(false)}>
          <div className={`delete-confirm-modal ${theme}`}>
            <h3>{t('fileList.confirmDelete')}</h3>
            <p>{t('fileList.confirmDeleteMessage', { filename: fileToDelete.filename })}</p>
            <div className="delete-confirm-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t('common.cancel')}
              </button>
              <button 
                className="delete-button"
                onClick={handleConfirmDelete}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FileList;