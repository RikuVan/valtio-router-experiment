<script lang="ts">
  import { onDestroy } from "svelte";
  import { subscribe } from "valtio/vanilla";
  import Home from './pages/Home.svelte'
  import Foo from './pages/Foo.svelte'
  import Bar from './pages/Bar.svelte'

  let page = Home
  let id

  import { Router } from "./router"
  const R = Router()

  R.routes.push(["/", () => {
    page = Home
  }])
  R.routes.push(["/foo", () => {
    page = Foo
  }])
  R.routes.push(["/foo/:id", () => {
    page = Foo
  }])
  R.routes.push(["/foo/:id/bar", () => {
    page = Bar
  }])

  subscribe(R, () => {
    id = R.current.params.id
  })

  const unlisten = R.listen()

  onDestroy(() => {
    unlisten()
  })
 

</script>

<main>
  <nav>
    <a href="/">Home</a>
    <a href="/bar">Bar</a>
    <a href="/foo">Foo</a>
  </nav>
  <section>
    <button on:click={() => R.route("/")}>Home</button>
    <button on:click={() => R.route("/foo")}>Foo</button>
    <button on:click={() => R.route("/foo/1")}>Foo id=1</button>
    <button on:click={() => R.route("/foo/2/bar")}>Foobar id=2</button>
  </section>
  <svelte:component this={page} id={id}/>
</main>

<style>
  section {
    padding-top: 2em;
  }
</style>