# SatQuery: SIH Pitch Deck & Architecture Guide

## 1. Problem Statement
Manual satellite imagery analysis cannot scale to time-sensitive emergency response, defense target reconnaissance, or disaster damage calculation.

## 2. Core Solution
SatQuery unifies natural-language RS-VQA (Remote Sensing Visual Question Answering) and bi-temporal difference detection using small-parameter multi-modal models (Falcon-0.7B-RS) coupled with SAM grounding and Open-CD.

## 3. Key Pipeline Nodes
* **AADI Agentic Dispatcher**: Routes natural language inputs directly to single-image grounding or bi-temporal comparison pipelines.
* **Dual-Pane Interactive Map**: Real-time canvas rendering overlaying bounding boxes, masks, and slider swipes on Leaflet base layers.
* **Audit Trail**: Step-by-step DAG telemetry reporting deterministic execution latencies.