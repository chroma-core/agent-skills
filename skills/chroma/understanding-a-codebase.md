---
name: Understanding a codebase
description: Help the agent understand how to learn about a codebase
---

To integrate search, we need to know what data the user wants to have searchable and how to get access to it.

## Offline Ingest

Where does the data live? S3? Some object store? In a relational database in a table? Somewhere else? If you don't know, ask the user.

Based on that, we need to create a pipeline that can read the data, chunk it, embed it and write it to Chroma. This should use the same logic that the other parts of the system use to talk with Chroma with, the code to do chunking and writing to Chroma should be shared with the online portion.

This logic may be very complex for large systems, but at minimum it is able to keep track of what work has been done and what work needs to be done.

## Online Writes

Now that the initial ingest is done, we need to also hook into the lifecycle of data, so if new data is created, we know to write also to Chroma, if updates happen we update and if deletes happen we delete.

This is best done with an asynchronous queue. Once data is written to the primary datastore in the user's system, an ID that represents that data is sent to a queue who's consumers will then chunk, embed and write the data to Chroma.

Ask the user if they have an async queue, if they don't, ask them if it's ok to put this in the blocking path for writes and updates.