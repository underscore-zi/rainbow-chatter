# Rainbow Chatter

Upon sending a message, your user color will automatically be changed. In less active chats this gives the impression at a glace of more unique chatters.

**This violates twitch terms** - Twitch at the moment does not allow automated access by third-parties to their GraphQL API which is necessary to make user color changes. This extension injects itself into the Twitch chat/stream pages in order to pretend to be a legitimate twitch user and make this change. It may seem harmless, but Twitch can decide to ban those using it. 

In theory, I don't do anything here that wouldn't work on the newest Manifest V3 version but I couldn't get any content-scripts to actually be loaded (much less try to do the injection process used here) when using Manifest V3 so this is a Manifest V2 extension, which is deprecated on Chrome, but still supported on Firefox. Nothing here really relies on V2 so it could probably be ported to Chrome by someone who knows whats going going but that isn't me.

## Usage

1. Download the .zip of this repository
2. Extract to the location of your choice
3. Load the folder as an "unpacked" extension into Firefox (Google for more specific instructions)
