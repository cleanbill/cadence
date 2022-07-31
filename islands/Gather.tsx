/** @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { tw } from "@twind";

interface GatherProps {
}

const css = `
.gather {
  display: grid;
  grid-template-columns: 12fr;
  grid-gap: 10px;
  margin: 10px;
}`

export default function Gather(props: GatherProps) {

  const [result, setResult] = useState('');
  const [joke, setJoke] = useState('');

  const getData = async () => {
    console.log('getting data');
    const response = await fetch('http://localhost:8000/api/joke')
    const result = await response.json();
    console.log(result.data);
    setResult(result.data[0].prod.message);
    setJoke(result.joke);
  }

  return (
    <div class='gather'>
      <span></span>
      <label >{joke}</label>

      <span></span>
      <button
        class={tw`bg-green-600`}
        onClick={() => getData()}
        disabled={!IS_BROWSER}
      >
        Get Deployment Info
      </button>

      <span></span>
      <p >{result}</p>

      <style>{css}
      </style>
    </div>
  );
}
