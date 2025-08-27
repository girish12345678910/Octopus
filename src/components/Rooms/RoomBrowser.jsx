import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  UserGroupIcon, 
  PlusIcon,
  HashtagIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { firebaseService } from '../../services/firebaseService';

const RoomBrowser = ({ onJoinRoom, onCreateRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Rooms', icon: HashtagIcon },
    { id: 'general', name: 'General', icon: UserGroupIcon },
    { id: 'tech', name: 'Technology', icon: HashtagIcon },
    { id: 'gaming', name: 'Gaming', icon: HashtagIcon },
    { id: 'music', name: 'Music', icon: HashtagIcon },
    { id: 'art', name: 'Art & Design', icon: HashtagIcon }
  ];

  useEffect(() => {
    // Subscribe to active rooms
    const unsubscribe = firebaseService.subscribeToActiveRooms((activeRooms) => {
      setRooms(activeRooms);
    });

    return unsubscribe;
  }, []);

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || room.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-black/20 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Browse Rooms</h2>
        <button
          onClick={onCreateRoom}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Create Room</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search rooms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <category.icon className="w-4 h-4" />
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Rooms List */}
      <div className="space-y-3">
        {filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <motion.div
              key={room.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onJoinRoom(room.roomId)}
              className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/30 rounded-xl p-4 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <HashtagIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-medium">{room.name}</h3>
                      {room.isPrivate && (
                        <LockClosedIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {room.description || 'No description'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-gray-400 text-sm">
                    <UserGroupIcon className="w-4 h-4" />
                    <span>{room.userCount || 0}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {room.category && (
                      <span className="bg-gray-700 px-2 py-1 rounded">
                        {room.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8">
            <HashtagIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No rooms found</p>
            <button
              onClick={onCreateRoom}
              className="mt-4 text-blue-400 hover:text-blue-300 transition-colors"
            >
              Create the first room
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomBrowser;
