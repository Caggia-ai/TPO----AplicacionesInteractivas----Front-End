/* Valoración con el componente rating de DaisyUI (solo lectura) */
export default function Stars({ id, rating }) {
  const r = Math.round(rating);
  return (
    <div className="rating rating-sm pointer-events-none" role="img" aria-label={`Valoración ${rating.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <input key={i} type="radio" name={`rt${id}`} className="mask mask-star-2 bg-base-content"
          tabIndex={-1} aria-hidden="true" checked={i === r} readOnly disabled />
      ))}
    </div>
  );
}
