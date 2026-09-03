import _get from 'lodash/get';

const ratioUtils = {
  buildRatios: (dynamicRatios = [], valueKey = 'id', addPadding = false) => {
    return dynamicRatios.map((ratio) => {
      const ratioId = _get(ratio, valueKey);
      const serverValue = _get(ratio, 'server_value', null);
      const serverValueObject = _get(ratio, 'server_value_object', null);

      if (!ratioId || typeof ratioId !== 'string' || !ratioId.includes(':')) {
        // A pixel-size id still carries the ratio, so it can draw the swatch —
        // but w/h stay null on purpose: the label falls back to name_key and
        // isSameRatio matches by id, and both are keyed on w == null.
        const size =
          ratioUtils.parseDimensions(ratioId) ??
          ratioUtils.parseDimensions(serverValue);

        return {
          ...ratio,
          w: null,
          h: null,
          serverValue,
          serverValueObject,
          padding:
            addPadding && size ? ratioUtils.calcPadding(size.w, size.h) : null,
        };
      }

      const { w, h } = ratioUtils.ratioSplit(ratioId);

      if (addPadding) {
        return {
          ...ratio,
          w,
          h,
          serverValue,
          serverValueObject,
          padding: ratioUtils.calcPadding(w, h),
        };
      }
      return {
        ...ratio,
        w,
        h,
        serverValue,
        serverValueObject,
      };
    });
  },

  // gpt-image ratio ids are pixel sizes ("1024x1024") with no parseable w/h,
  // so comparing w/h alone matches every option — identify those by id.
  // Options with neither w/h nor id (i2v "adaptive") keep the w/h comparison.
  isSameRatio: (option, ratio) => {
    if (!option || !ratio) return false;
    if (option.w == null && option.id != null) {
      return option.id === ratio.id;
    }
    return option.w === ratio.w && option.h === ratio.h;
  },

  // MSR ships some ratio ids as pixel sizes ("1024x1024") rather than W:H, and
  // a few models carry the size only in server_value ("2688*1536").
  parseDimensions: (value) => {
    if (typeof value !== 'string' && typeof value !== 'number') return null;

    const parts = String(value).split(/[:x*×]/i);
    if (parts.length !== 2) return null;

    const [w, h] = parts.map(Number);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      return null;
    }
    return { w, h };
  },

  calcPadding: (w, h) => {
    if (w === h) {
      return '0'; // 正方形
    }

    if (w > h) {
      // 橫向 → 上下 padding
      const percent = ((1 - h / w) * 100) / 2;
      return `${percent}% 0`;
    } else {
      // 直向 → 左右 padding
      const percent = ((1 - w / h) * 100) / 2;
      return `0 ${percent}%`;
    }
  },
  ratioSplit: (ratioId) => {
    if (ratioId?.indexOf(':') > 0) {
      const [w, h] = ratioId.split(':').map(Number);
      return { w, h, ratioId };
    }
    return { w: null, h: null, ratioId };
  },
};

export default ratioUtils;
