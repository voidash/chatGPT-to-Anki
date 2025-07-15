# Chat to Anki flashcards

This is to be written in React and TypeScript and is a chrome extension. 

## Purpose
- You can select a multiple chats in ChatGPT. There should be checkbox for the selected chats. Then for each selected chat, it should open it up , and ask a new question in that chat to generate flashcards. The prompt should be very verbose and detailed. It should ask for the following:

```
- What are the main topics covered in the chat? 
  - identify the key points and summaries for each topic with key takeaways and ideas worth remembering. 
  - Based on those key points, separate it out into topics like it could be general questions, CS questions etc. Can you generate flashcards based on the key points and summary?

  The format of the answer should be:

   Topic, Question, Answer

   in csv format
   
```

After reading the answer for all the selected chats, it should be stored somewhere in the extension storage. You should use https://genanki.js.org/#/README to create anki flashcards. There should be configuration page, that allows user to see the generated csv values. It should be pretty to look at. Then based on the csv values, it should bundle flashcards based on topics and generate anki package that should be syncable to ankiweb. 

There is ChatGPT.html file that you can look for reference on how to add checkboxes on chats for export and where to add export button.
There is also chat-window.html file for you to identify the input box to ask question. The placeholder has "Ask anything". 

