import { dispatch } from "@plugos/plugos-syscall/event";
import { Manifest } from "@silverbulletmd/common/manifest";
import { findNodeOfType } from "@silverbulletmd/common/tree";
import {
  flashNotification,
  save,
} from "@silverbulletmd/plugos-silverbullet-syscall/editor";
import { parseMarkdown } from "@silverbulletmd/plugos-silverbullet-syscall/markdown";
import {
  deletePage,
  listPages,
  readPage,
  writePage,
} from "@silverbulletmd/plugos-silverbullet-syscall/space";
import {
  invokeFunction,
  reloadPlugs,
} from "@silverbulletmd/plugos-silverbullet-syscall/system";
import YAML from "yaml";

async function listPlugs(): Promise<string[]> {
  let unfilteredPages = await listPages(true);
  return unfilteredPages
    .filter((p) => p.name.startsWith("_plug/"))
    .map((p) => p.name.substring("_plug/".length));
}

export async function updatePlugsCommand() {
  await save();
  flashNotification("Updating plugs...");
  await invokeFunction("server", "updatePlugs");
  flashNotification("And... done!");
  await reloadPlugs();
}

export async function updatePlugs() {
  let { text: plugPageText } = await readPage("PLUGS");

  let tree = await parseMarkdown(plugPageText);

  let codeTextNode = findNodeOfType(tree, "CodeText");
  if (!codeTextNode) {
    console.error("Could not find yaml block in PLUGS");
    return;
  }
  let plugYaml = codeTextNode.children![0].text;
  let plugList = YAML.parse(plugYaml!);
  console.log("Plug YAML", plugList);
  let allPlugNames: string[] = [];
  for (let plugUri of plugList) {
    let [protocol, ...rest] = plugUri.split(":");
    let manifests = await dispatch(`get-plug:${protocol}`, rest.join(":"));
    if (manifests.length === 0) {
      console.error("Could not resolve plug", plugUri);
    }
    // console.log("Got manifests", plugUri, protocol, manifests);
    let manifest = manifests[0];
    allPlugNames.push(manifest.name);
    // console.log("Writing", `_plug/${manifest.name}`);
    await writePage(
      `_plug/${manifest.name}`,
      JSON.stringify(manifest, null, 2)
    );
  }

  // And delete extra ones
  for (let existingPlug of await listPlugs()) {
    if (!allPlugNames.includes(existingPlug)) {
      console.log("Removing plug", existingPlug);
      await deletePage(`_plug/${existingPlug}`);
    }
  }
  await reloadPlugs();
}

export async function getPlugHTTPS(url: string): Promise<Manifest> {
  let fullUrl = `https:${url}`;
  console.log("Now fetching plug manifest from", fullUrl);
  let req = await fetch(fullUrl);
  if (req.status !== 200) {
    throw new Error(`Could not fetch plug manifest from ${fullUrl}`);
  }
  let json = await req.json();

  return json;
}

export async function getPlugGithub(identifier: string): Promise<Manifest> {
  let [owner, repo, path] = identifier.split("/");
  let [repoClean, branch] = repo.split("@");
  if (!branch) {
    branch = "main"; // or "master"?
  }
  return getPlugHTTPS(
    `//raw.githubusercontent.com/${owner}/${repoClean}/${branch}/${path}`
  );
}
