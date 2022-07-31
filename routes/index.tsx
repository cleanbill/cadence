/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { useState } from 'preact/hooks';
import Gather from "../islands/Gather.tsx";


export default   function Home() {
  const css = `
  .label {
    writing-mode: vertical-lr;
    font-weight: bolder;
    padding-left: 4px;
    padding-top: 15%;
  }
  .main {
    display: grid;
    grid-template-columns: 0.5fr 11fr
  }`

  return (
    <div class={tw`p-4 mt-10 mx-auto max-w-screen-md bg-blue-500 main`}>
      <span>
        <img
          src="/logo.svg"
          height="100px"
          alt="the fresh logo: a sliced lemon dripping with juice"
        />
        <label class='label'>FRESH</label>
      </span>
      <Gather />
      <style>{css}
      </style>

    </div>
  );
}
