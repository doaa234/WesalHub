import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useTranslation } from 'react-i18next';
import { FaDownload, FaEye, FaFilePdf, FaFileWord, FaFileImage, FaFile } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import config from '../config';
import api from '../services/api';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const FileViewer = ({ file, onClose }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'download'

  useEffect(() => {
    const fetchFile = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/files/${file.id}`, {
          responseType: 'blob'
        });
        
        // Create a URL for the blob
        const fileUrl = URL.createObjectURL(response.data);
        setFileData(fileUrl);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching file:', err);
        setError(t('fileViewer.errorLoading'));
        setLoading(false);
      }
    };

    if (file) {
      fetchFile();
    }

    // Cleanup function to revoke object URL
    return () => {
      if (fileData) {
        URL.revokeObjectURL(fileData);
      }
    };
  }, [file, t]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handlePrevPage = () => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages));
  };

  const handleDownload = () => {
    if (fileData) {
      const link = document.createElement('a');
      link.href = fileData;
      link.download = file.filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileIcon = () => {
    const fileType = file.mimeType;
    const fileTypeConfig = config.fileStorage.allowedFileTypes[fileType];
    
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

  const renderFilePreview = () => {
    if (loading) {
      return <div className="file-loading">{t('fileViewer.loading')}</div>;
    }

    if (error) {
      return <div className="file-error">{error}</div>;
    }

    if (!fileData) {
      return <div className="file-error">{t('fileViewer.noData')}</div>;
    }

    const fileType = file.mimeType;
    const fileTypeConfig = config.fileStorage.allowedFileTypes[fileType];

    // If preview is not supported or user chose download mode
    if (!fileTypeConfig?.preview || viewMode === 'download') {
      return (
        <div className="file-download-container">
          <div className="file-icon">{getFileIcon()}</div>
          <div className="file-info">
            <h3>{file.filename}</h3>
            <p>{file.size} bytes</p>
            <p>{new Date(file.uploadedAt).toLocaleDateString()}</p>
          </div>
          <button 
            className="download-button"
            onClick={handleDownload}
          >
            <FaDownload /> {t('fileViewer.download')}
          </button>
        </div>
      );
    }

    // Render based on file type
    switch (fileType) {
      case 'application/pdf':
        return (
          <div className="pdf-container">
            <Document
              file={fileData}
              onLoadSuccess={onDocumentLoadSuccess}
              options={{
                cMapUrl: 'cmaps/',
                cMapPacked: true,
              }}
              className={`pdf-document ${theme}`}
            >
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className={`pdf-page ${theme}`}
              />
            </Document>
            
            {numPages > 1 && (
              <div className="pdf-controls">
                <button 
                  onClick={handlePrevPage} 
                  disabled={pageNumber <= 1}
                  className={`pdf-control-button ${theme}`}
                >
                  {t('fileViewer.prevPage')}
                </button>
                <p>
                  {t('fileViewer.pageInfo', { current: pageNumber, total: numPages })}
                </p>
                <button 
                  onClick={handleNextPage} 
                  disabled={pageNumber >= numPages}
                  className={`pdf-control-button ${theme}`}
                >
                  {t('fileViewer.nextPage')}
                </button>
              </div>
            )}
          </div>
        );
        
      case 'image/jpeg':
      case 'image/png':
        return (
          <div className="image-container">
            <img 
              src={fileData} 
              alt={file.filename} 
              className="preview-image"
            />
          </div>
        );
        
      default:
        return (
          <div className="unsupported-file">
            <p>{t('fileViewer.unsupportedPreview')}</p>
            <button 
              className="download-button"
              onClick={handleDownload}
            >
              <FaDownload /> {t('fileViewer.download')}
            </button>
          </div>
        );
    }
  };

  return (
    <div className={`file-viewer-container ${theme}`}>
      <div className="file-viewer-header">
        <h2>{file.filename}</h2>
        <div className="file-viewer-actions">
          <button 
            className={`view-mode-button ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => setViewMode('preview')}
            disabled={!config.fileStorage.allowedFileTypes[file.mimeType]?.preview}
          >
            <FaEye /> {t('fileViewer.preview')}
          </button>
          <button 
            className={`view-mode-button ${viewMode === 'download' ? 'active' : ''}`}
            onClick={() => setViewMode('download')}
          >
            <FaDownload /> {t('fileViewer.download')}
          </button>
          <button 
            className="close-button"
            onClick={onClose}
          >
            {t('fileViewer.close')}
          </button>
        </div>
      </div>
      
      <div className="file-viewer-content">
        {renderFilePreview()}
      </div>
      
      <div className="file-viewer-footer">
        <div className="file-metadata">
          <p>{t('fileViewer.uploadedOn')}: {new Date(file.uploadedAt).toLocaleDateString(i18n.language)}</p>
          <p>{t('fileViewer.fileSize')}: {(file.size / 1024).toFixed(2)} KB</p>
          <p>{t('fileViewer.fileType')}: {file.mimeType}</p>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;