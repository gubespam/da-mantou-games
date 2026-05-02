import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TimelinePrototype.css';

export default function TimelinePrototype() {

  return (
    <div>
      <table class="years">
        <tr class="years">
          <td colSpan={2}>1200</td>
          <td colSpan={2} >1250</td>
          <td colSpan={2} >1300</td>
          <td colSpan={2} >1350</td>
        </tr>
        <tr class="year-line">
          <td colSpan={1} class="offset"></td>
          <td colSpan={2}></td>
          <td colSpan={2}></td>
          <td colSpan={2}></td>
          <td colSpan={1}  class="offset right-offset" ></td>
        </tr>
      </table>
        <div class="period" style={{ left: '100px', top: '100px' }}>This is a longer history period</div>
        <div class="period" style={{ left: '150px', top: '150px' }}>This is a really really long history period</div>
        <div class="period" style={{ left: '200px', top: '200px' }}>This is a short...</div>
        <div class="event"  style={{ left: '300px', top: '235px' }}>This is an event</div>
    </div>
  );
}
