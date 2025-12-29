class RecorderProcessor extends AudioWorkletProcessor {
  // 将音频数据编码为 PCM 格式
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const pcmData = new Int16Array(input[0].length);
      for (let i = 0; i < input[0].length; i++) {
        const s = Math.max(-1, Math.min(1, input[0][i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      this.port.postMessage({ buffer: pcmData }, [pcmData.buffer]);
    }
    return true;
  }
}

registerProcessor('recorder-processor', RecorderProcessor);