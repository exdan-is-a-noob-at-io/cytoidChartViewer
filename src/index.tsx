import React, { FC, useState } from "react"
import ReactDOM from "react-dom"
import "./index.css"

//Data Types
interface PositionFunction {
  Type: number;
  Arguments: number[];
}

interface page {
  start_tick: number;
  end_tick: number;
  scan_line_direction: number;          //scan_line_direction:1 means moving up
  PositionFunction?: PositionFunction;
}

interface tempo {
  tick:number;
  value:number;
}

interface note {
  page_index: number,     //what page the note is in
  type: number,           //0 = tap note, 1 =hold note, 2 = long hold note, 3 = drag head note, 
                          //4 = drag child note, 5 = flick note.
  id: number,             //id of the note
  tick: number,           //tick of the note; read up about it 
  x: number,              //x pos of the note  (0 to 1)
  has_sibling?: boolean,  //if there is another note on the same tick
  hold_tick?: number,     //How long the hold is in ticks
  next_id: number,        //If the note is not a drag, this should be 0. If it is a drag, this points
                          //to the next note in the drag (-1 if it is the last note in the drag)
  is_forward?: boolean,
  NoteDirection?: number,

  approach_rate?: number
}

interface chartData {
  format_version?: number,  //default to 0
  time_base?: number,
  start_offset_time?: number,
  end_offset_time?: number,
  is_start_without_ui?: boolean,
  music_offset?: number,
  page_list: page[],
  tempo_list: tempo[],
  event_order_list?: any,
  note_list:note[],
}

//Functions in regard to the aforementioned data types.
function isTickInPage(tick:number, page:page) {
  return (page.start_tick <= tick) ? (tick < page.end_tick) ? 1 : 2 : 0
}

function convertValueToBPM(tempo:tempo){
  return 60000000/tempo.value;
}

//UI Elements
interface ChartPageDisplayProps {
  currPageNumber: number,
  chart: chartData
}

export const ChartPageDisplay: FC<ChartPageDisplayProps> = (props) => {
  const chart = props.chart;
  const currPageNumber = props.currPageNumber;

  const fetchPage = (currPageNumber_: number) => {
    return (currPageNumber_ < chart.page_list.length) ? chart.page_list[currPageNumber_] : null;
  }

  const fetchValidNotes = (currPageNumber_: number) => {
    const currPage = fetchPage(currPageNumber_);
    let validNotes = Array(0);
    let currNoteId = 0;
    let tickInPageOut = 0
    while (currPage !== null && tickInPageOut < 2 && currNoteId < chart.note_list.length){
      const currNote = chart.note_list[currNoteId];
      tickInPageOut = isTickInPage(currNote.tick, currPage);
      if (tickInPageOut === 1){
        validNotes.push(currNote);
      }
      currNoteId++;
    }

    console.log(validNotes)
    return validNotes;
  }

  const fetchValidTempos = (currPageNumber_: number) => {
    const currPage = fetchPage(currPageNumber_);
    let validTempos = Array(0);
    let it = 0;
    let tickInPageOut = 0
    while (currPage && tickInPageOut < 2 && it < chart.tempo_list.length){
      const currTempo = chart.tempo_list[it];
      tickInPageOut = isTickInPage(currTempo.tick, currPage)
      if (tickInPageOut === 1){
        validTempos.push(currTempo);
      }      
      it++;
    }

    return validTempos;
  } 

  return (
  <div>
    <body>
      {JSON.stringify(fetchValidNotes(currPageNumber))}
    </body>
    <body>
      {JSON.stringify(fetchValidTempos(currPageNumber))}
    </body>
  </div>
  )
}

export const DataLoader: FC<Record<string, never>> = (props) => {
  const [chart, setChart] = useState<chartData>(
    {
      format_version: 0,  //default to 0
      time_base: 0,
      start_offset_time: 0,
      end_offset_time: 0,
      is_start_without_ui: false,
      music_offset: 0,
      page_list: Array(1).fill(
        {
          "start_tick": 0,
          "end_tick": 960,
          "scan_line_direction": 1
        }
      ),
      tempo_list: Array(1).fill(
        {
          "tick": 0,
          "value": 500000
        },
      ),
      note_list:Array(1).fill(
        {
          "page_index": 0,
          "type": 1,
          "id": 0,
          "tick": 0,
          "x": 0,
          "has_sibling": false,
          "hold_tick": 0,
          "next_id": 0
        }
      ),
    }
  )

  const [currPageNumber, setPageNumber] = useState<number>(
    0
  );

  let fileInput = React.useRef<HTMLInputElement>(null);
  let chartPageNumberInput = React.useRef<HTMLInputElement>(null);
  
  const handleChangePageNumber = (change:number) => {
    return () => {
      setPageNumber((prev) => {
        console.log(prev+change);
        return (prev + change < 0)? 0 : 
        (prev + change >= chart.page_list.length)? chart.page_list.length-1 : prev + change
      })
    }
  }

  const handleSubmit = async ()=> {
    if (fileInput.current && fileInput.current.files){
      const fileText = await fileInput.current.files[0].text();
      setChart((prev) => {
        return JSON.parse(fileText)
      })
      setPageNumber((prev) => {
        return 0;
      })
    }
  }
  

  return <div className="main">
    <div className="horFlex"> 
      <body> 
        Input Your File Here!!
      </body>
      <input type="file" className="text" ref={fileInput} accept=".txt,.json"/>
      <button onClick={handleSubmit} className="text">Submit!</button>
    </div>

    <div>
      <button className="button" onClick={handleChangePageNumber(-10)}> -10 </button>
      <button className="button" onClick={handleChangePageNumber(-1)}> -1 </button>
      <input className="text" ref={chartPageNumberInput} min="0" max={chart.page_list.length} name="quantity" value={currPageNumber} type="number"/>
      <button className="button" onClick={handleChangePageNumber(1)}>+1</button>
      <button className="button" onClick={handleChangePageNumber(10)}>+10</button>
    </div>

    <ChartPageDisplay currPageNumber = {currPageNumber} chart = {chart}/>
  </div>
}

ReactDOM.render(
  <DataLoader/>
  , 
  document.getElementById("root")
);