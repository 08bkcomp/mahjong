import React, { Component } from 'react';
import logo from './logo.svg';
import './InGame.css';
import './index.css';

var winds = {
		east: '\u{1F000}',
		south: '\u{1F001}',
		west: '\u{1F002}',
		north: '\u{1F003}',
}

var dragons = {
		red: '\u{1F004}',
		green: '\u{1F005}',
		white: '\u{1F006}',
}

var seasons = {
		spring: '\u{1F026}',
		summer: '\u{1F027}',
		autumn: '\u{1F028}',
		winter: '\u{1F029}',
}

var flowers = {
		plum: '\u{1F022}',
		orchid: '\u{1F023}',
		bamboo: '\u{1F024}',
		chrys: '\u{1F025}',
}

var bamboo = ['\u{1F010}','\u{1F011}','\u{1F012}','\u{1F013}','\u{1F014}','\u{1F015}','\u{1F016}','\u{1F017}','\u{1F018}']

var characters = ['\u{1F007}','\u{1F008}','\u{1F009}','\u{1F00A}','\u{1F00B}','\u{1F00C}','\u{1F00D}','\u{1F00E}','\u{1F00F}',]

var dots = ['\u{1F019}','\u{1F01A}','\u{1F01B}','\u{1F01C}','\u{1F01D}','\u{1F01E}','\u{1F01F}','\u{1F020}','\u{1F021}',]

var pieceback = '\u{1F02B}'

function Piece(props) {
		var comment = props.comment ? props.comment : "";
		return (
				<div class={props.class}>{comment + props.piece}</div>
		);
}

function ActionItem(props) {
		return (
				<div class={props.active ? "actionactive" : "actioninactive"}><span>{props.action}</span></div>
		)
}

function ActionList(props) {
		if(!props.status) {return null};
		return (
				<div class="actionlist">
						<ActionItem active={props.status.draw} action="Draw"/>
						<ActionItem active={props.status.chow} action="Chow"/>
						<ActionItem active={props.status.pung} action="Pung"/>
						<ActionItem active={props.status.kong} action="Kong"/>
						<ActionItem active={props.status.eye} action="Eye (M)"/>
						<ActionItem active={props.status.rob} action="Rob (M)"/>
						<ActionItem active={props.status.mahjong} action="Mahjong"/>
				</div>
		)
}

function GameInfo(props) {
		var info = props.info;

		return (
				<div class="gameinfo">
						<Piece class="focuspiece littleinfo" piece={info.myWind} comment="R:"/>
						<Piece class="focuspiece littleinfo" piece={info.roundWind} comment="P:"/>
						<div class="littleinfo">{info.piecesLeft}</div>
						<ActionList status={info.myActions} />
				</div>
		);
}

function OpHand(props) {
		return (
				<div class="opponent">
						<div class="opwind otherpiece">{props.wind}</div>
						<div class="ophand">
							{props.hand.map((piece, i) => {
									return <Piece class="otherpiece" piece={piece} />;
							})}
						</div>
				</div>
		)
}

function MyHand(props) {
		return (
				<div class="myfullhand">
						<div class="myhand">
							{props.hand.map((piece, i) => {
									return <Piece class="focuspiece" piece={piece} />;
							})}
						</div>
						<div class="myexposed">
							{props.exposed.map((piece, i) => {
									return <Piece class="focuspiece" piece={piece} />;
							})}
						</div>
				</div>
		)
}

class Board extends Component {
		constructor(props) {
				super(props);
				this.state = {
						info: {
								roundWind: winds.east,
								myWind: winds.west,
								myActions: {draw: false,
											chow: false,
											pung: false,
											kong: false,
											eye: false,
											rob: false,
											mahjong: false,
											},
								piecesLeft: 144,
							},
						myHand: [],
						myExposed: [winds.east, pieceback],
						otherExposed: [
										{	wind: winds.north,
											hand: [bamboo[3]],
										},
										{	wind: winds.west,
											hand: [dots[2],dots[3],dots[4],],
										}
										],
						discards: [],
				}
		}

		render() {
				return (
						<div class="board">
							<GameInfo info={this.state.info}/>
							<div class="mainboard">
								<div class="otherhands">
									{this.state.otherExposed.map((op, i) => {
											return <OpHand wind={op.wind} hand={op.hand} />;
									})}
								</div>
								<div class="discards">
									{this.state.discards.map((piece, i) => {
											return <Piece class="focuspiece" piece={piece} />;
									})}
								</div>
								<MyHand hand={this.state.myHand} exposed={this.state.myExposed} />
							</div>
						</div>
				)
		}
}

export default Board;
