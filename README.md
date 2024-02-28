# NPC-library updated with llm call tools

A collection of additional llm tools forked from dcl-npc-toolkit.

Capabilities of this library:

- Start a connection with colyseus server using 2 arguments / 2 functions

- Create default quick dialogue sequence to initiate llm dialogue

- Dialogue is generated automatically after message arrives from server

## Install the base dcl-npc-toolkit library

## Via the CLI

1. Install the library as an npm bundle. Run this command in your scene's project folder:

```ts
npm i dcl-npc-toolkit-ai-version
```

2. Install the dependent sdk utils library as an npm bundle. Run this command in your scene's project folder:

```
npm i @dcl-sdk/utils -B
```

3. Run `dcl start` or `dcl build` so the dependencies are correctly installed.

4. Import the library into the scene's script. Add this line at the start of your `index.ts` file, or any other TypeScript files that require it:

```ts
import * as npc from 'dcl-npc-toolkit'
```

5. In your TypeScript file, call the `create` function passing it a `TransformType` and a `NPCData` object. The `NPCData` object requires a minimum of a `NPCType` and a function to trigger when the NPC is activated:

```ts
export let myNPC = npc.create(
	{
		position: Vector3.create(8, 0, 8),
		rotation: Quaternion.Zero(),
		scale: Vector3.create(1, 1, 1),
	},
	//NPC Data Object
	{
		type: npc.NPCType.CUSTOM,
		model: 'models/npc.glb',
		onActivate: () => {
			console.log('npc activated')
		},
	}
)
```

## Adding llm tools

1. Change NPC onActivate to:

```ts
onActivate: async (data) => {
	npc.initAiDialog(myNPC);
},
```

This will create a generic dialogue, that allows user to call an input prompt to send to llm on server side

2. Add new arguments to create() function:

```ts
export let myNPC = npc.create(
	{
		position: Vector3.create(8, 0, 8),
		rotation: Quaternion.Zero(),
		scale: Vector3.create(1, 1, 1),
	},
    //NPC Data Object
	{
		type: npc.NPCType.CUSTOM,
		model: 'models/npc.glb',
		onActivate: () => {
			console.log('npc activated')
		},
	},true,"http://localhost:2574","llm_room"
)
```

Those are RagMode, server url and room name. This is designed to work with colyseus server. RagMode will mark this npc to use or not use Rag Chain System. Server url is a connection url for server and room name should specify the colyseus room name that is used on server side.

You need to specify server arguments only for the first NPC you create, others will share it. Also you can skip these arguments and setup url and room name beforehand like this:

```ts
setCustomServerUrl(url);
setCustomServerRoomName(room_name);
```

3. Add response on server side:

Install llm_response_backend module on the server side and add onMessage that sends response to frontend:

```ts
this.onMessage("getAnswer", async (client, msg) => {
		let result;
		// @ts-ignore
		
		let text = "";
		let voiceUrl = "";
		// @ts-ignore
		// msg will have rag variable, based on npc using/not using rag
		if (msg.rag) {
			const result = await mainChain.getRagAnswer(msg.text,voiceGenerationEnabled,await appReadyPromise);
			text = result.response.text;
			voiceUrl = result.exposedUrl;
		} else {
			const systemMessage = 'Some system message';
			const result = await getLLMTextAndVoice(systemMessage,msg.text,voiceGenerationEnabled,await appReadyPromise);
			text = result.response;
			voiceUrl = result.exposedUrl;
		}

		// sending response to NPC
		client.send("getAnswer", {
			answer: text,
			voiceUrl: voiceUrl,
			voiceEnabled: voiceGenerationEnabled,
			id: msg.id
		});
	}
)
```

Main parts of it is the name of the message "getAnswer" on receiving and on sending back, so it will trigger in the NPC. Other parts may be changed for your desired task.