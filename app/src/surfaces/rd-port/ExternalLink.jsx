export default function ExternalLink(props) {
  const { color = '#11181A', opacity = '.65' } = props;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none">
      <path
        fill={color}
        fillOpacity={opacity}
        d="M1 9.5v-7A1.5 1.5 0 0 1 2.5 1h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 1 1 0v3A1.5 1.5 0 0 1 9.5 11h-7A1.5 1.5 0 0 1 1 9.5m10-5a.5.5 0 0 1-1 0V2.707L6.354 6.354a.5.5 0 1 1-.708-.708L9.293 2H7.5a.5.5 0 0 1 0-1h3a.5.5 0 0 1 .5.5z"
      />
    </svg>
  );
}

