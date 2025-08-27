import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PaperClipIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import { toast } from 'react-hot-toast';

const FileUpload = ({ onFileUploaded, disabled }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `chat-files/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      onFileUploaded({
        url: downloadURL,
        name: file.name,
        type: file.type,
        size: file.size
      });

      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      setPreview(null);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
        />
        <label
          htmlFor="file-upload"
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer"
        >
          <PaperClipIcon className="w-5 h-5 text-gray-400" />
        </label>
      </div>

      {preview && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-16 left-4 bg-gray-800 border border-gray-600 rounded-lg p-2"
        >
          <div className="relative">
            <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded" />
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
            >
              <XMarkIcon className="w-3 h-3 text-white" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default FileUpload;
