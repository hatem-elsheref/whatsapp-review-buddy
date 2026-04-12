import { useState } from 'react';
import CustomerList from './CustomerList';
import ChatArea from './ChatArea';
import { Conversation } from '@/lib/api';

const ChatInbox = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-border flex-shrink-0">
        <CustomerList 
          onSelectConversation={setSelectedConversation}
          selectedId={selectedConversation?.id}
        />
      </div>
      <div className="flex-1">
        {selectedConversation ? (
          <ChatArea conversation={selectedConversation} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <p className="font-medium">Select a conversation to start chatting</p>
              <p className="text-sm mt-1">Choose from the list on the left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInbox;