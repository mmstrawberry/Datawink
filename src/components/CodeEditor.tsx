import { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { observer } from 'mobx-react';
import store from '../store';

self.MonacoEnvironment = {
	getWorkerUrl: function (_moduleId: unknown, label: string) {
		if (label === 'json') {
			return './json.worker.bundle.js';
		}
		if (label === 'css' || label === 'scss' || label === 'less') {
			return './css.worker.bundle.js';
		}
		if (label === 'html' || label === 'handlebars' || label === 'razor') {
			return './html.worker.bundle.js';
		}
		if (label === 'typescript' || label === 'javascript') {
			return './ts.worker.bundle.js';
		}
		return './editor.worker.bundle.js';
	}
};

const CodeEditor = observer(function CodeEditor() {
	const divEl = useRef<HTMLDivElement>(null);
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const isUserEditRef = useRef(false);
	const isApplyingStoreRef = useRef(false);

	useEffect(() => {
		const container = divEl.current;
		if (!container) return;

		const editor = monaco.editor.create(container, {
			value: store.data.code,
			language: 'typescript',
			readOnly: false,
			fontSize: 12,
			minimap: { enabled: false },
			theme: 'vs-light',
			glyphMargin: false,
			lineNumbers: 'on',
			wordWrap: 'on',
			lineDecorationsWidth: 0,
			automaticLayout: false,
		});
		editorRef.current = editor;

		const layoutEditor = () => {
			if (container.isConnected) {
				editor.layout();
			}
		};

		const contentDisposable = editor.onDidChangeModelContent(() => {
			if (isApplyingStoreRef.current) return;
			isUserEditRef.current = true;
			store.data.setCode(editor.getValue());
		});

		const resizeObserver = new ResizeObserver(() => {
			layoutEditor();
		});
		resizeObserver.observe(container);

		requestAnimationFrame(layoutEditor);

		return () => {
			contentDisposable.dispose();
			resizeObserver.disconnect();
			editor.dispose();
			editorRef.current = null;
		};
	}, []);

	useEffect(() => {
		const editor = editorRef.current;
		if (!editor) return;

		if (isUserEditRef.current) {
			isUserEditRef.current = false;
			return;
		}

		const current = editor.getValue();
		if (current !== store.data.code) {
			isApplyingStoreRef.current = true;
			editor.setValue(store.data.code);
			isApplyingStoreRef.current = false;
		}
	}, [store.data.code, store.devFlag]);

	return (
		<div
			className="code-editor"
			ref={divEl}
			style={{
				width: '100%',
				height: '100%',
				minHeight: 120,
				overflow: 'hidden',
				border: '1px solid rgb(230, 230, 230)',
				borderRadius: '4px',
				boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
			}}
		/>
	);
});

export default CodeEditor;
